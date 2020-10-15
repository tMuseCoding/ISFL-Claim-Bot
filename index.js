const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('./config.json')
const mongo = require('./mongo')
const claimchannelSchema = require('./schemas/claimchannel-schema')

let prefix = config.prefix

const cache = {}

client.once('ready', async () => {
	console.log('ISFL Claim Bot Loaded!');

	await mongo().then((mongoose) => {
		try {
			console.log('Connected to mongo!');
		} finally {
			mongoose.connection.close();
		}
	});
});

client.on('message', async message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	let args = message.content.slice(prefix.length).trim().split(/ +/);
	let command = args.shift().toLowerCase();

	if (command === 'ping') {
		message.channel.send('Pong!');
	}

	if (command === 'invite') {
		replyWithInvite(message);
	}

	if (command === 'channel') {
		let channel = getChannelFromMention(args[0])
		if (channel == null) {
			message.reply("I can't see that channel!");
			return;
		} else {
			cache[message.guild.id] = [channel]

			await mongo().then(async (mongoose) => {
				try {
					await claimchannelSchema.findOneAndUpdate({
						_id: message.guild.id
					}, {
						_id: message.guild.id,
						channelId: channel,
					}, {
						upsert: true
					})
					channel.send("Found it! I will post the claims I find in here.")
				} catch (e) {
					console.log(e)
					message.reply("Something went wrong! Try again.\nIf you keep seeing this error there might be a problem with the bot.")
				} finally {
					mongoose.connection.close();
				}
			});

		}
	}

	if (command === 'claim') {
		let data = cache[message.guild.id]

		if (!data) {
			fetchChannelFromDb(message)
		}
		
		data = cache[message.guild.id]
		
		const channelId = data[0]
		const claimChannel = message.guild.channels.cache.get(channelId)

		claimChannel.send("Posting claims in here. This is a fake claim blabla")
	}
});

function getChannelFromMention(mention) {
	if (!mention) return;

	if (mention.startsWith('<#') && mention.endsWith('>')) {
		mention = mention.slice(2, -1)

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return client.channels.cache.get(mention)
	}
}

async function fetchChannelFromDb(message) {
	console.log('FETCHING FROM DATABASE')
	await mongo().then(async (mongoose) => {
		try {
			const result = await claimchannelSchema.findOne({ _id: message.guild.id })

			cache[message.guild.id] = [result.channelId]
		} finally {
			mongoose.connection.close()
		}
	});
}

async function replyWithInvite(message) {
	const embedInvite = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle('Invite me!')
		.setURL('https://discord.com/api/oauth2/authorize?client_id=766223518659772416&permissions=149504&scope=bot')
		.setAuthor('ISFL Claim Thread Watcher', 'https://i.imgur.com/fPW1MS5.png')
		.setDescription('A Bot to automatically post the newest claims from the ISFL Claim Thread!')
		.setThumbnail('https://i.imgur.com/fPW1MS5.png')
		.setTimestamp()
		.setFooter('Invite send at: ');

	message.channel.send(embedInvite);
}

client.login(config.token);
