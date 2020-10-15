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
	const { member, channel, content, guild, author } = message
	if (!content.startsWith(prefix) || author.bot) return;

	let args = content.slice(prefix.length).trim().split(/ +/);
	let command = args.shift().toLowerCase();

	if (command === 'ping') {
		channel.send('Pong!');
	}

	if (command === 'invite') {
		replyWithInvite(channel);
	}

	if (command === 'channel') {
		let newChannel = getChannelFromMention(args[0])
		if (newChannel == null) {
			message.reply("I can't see that channel!");
			return;
		} else {
			cache[guild.id] = newChannel.id

			await mongo().then(async (mongoose) => {
				try {
					await claimchannelSchema.findOneAndUpdate({
						_id: guild.id
					}, {
						_id: guild.id,
						channelId: newChannel.id,
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
		let claimchannelId = cache[guild.id]

		if (!claimchannelId) {
			console.log('FETCHING FROM DATABASE')
			await mongo().then(async (mongoose) => {
				try {
					const result = await claimchannelSchema.findOne({ _id: guild.id })

					cache[guild.id] = claimchannelId = result.channelId
				} finally {
					mongoose.connection.close()
				}
			});
		}
		
		guild.channels.cache.get(claimchannelId).send("test")
	}

	function getChannelFromMention(mention) {
		if (!mention) return;

		if (mention.startsWith('<#') && mention.endsWith('>')) {
			mention = mention.slice(2, -1)

			return client.channels.cache.get(mention)
		}
	}


	async function replyWithInvite(channel) {
		const embedInvite = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Invite me!')
			.setURL('https://discord.com/api/oauth2/authorize?client_id=766223518659772416&permissions=149504&scope=bot')
			.setAuthor('ISFL Claim Thread Watcher', 'https://i.imgur.com/fPW1MS5.png')
			.setDescription('A Bot to automatically post the newest claims from the ISFL Claim Thread!')
			.setThumbnail('https://i.imgur.com/fPW1MS5.png')
			.setTimestamp()
			.setFooter('Invite send at: ');

		channel.send(embedInvite);
	}
});

client.login(config.token);
