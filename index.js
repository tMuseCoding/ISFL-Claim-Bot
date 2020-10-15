const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('./config.json')
const mongo = require('./mongo')
const claimchannelSchema = require('./schemas/claimchannel-schema')
const claimthreadSchema = require('./schemas/claimthread-schema')

const rp = require('request-promise');

const prefix = config.prefix
const claimChannelCache = {}

client.once('ready', async () => {
	console.log('ISFL Claim Bot Loaded!');

	await mongo().then((mongoose) => {
		try {
			console.log('Connected to mongo!');
		} finally {
			mongoose.connection.close();
		}
	});

	client.setInterval(checkThreads, 5000);
});

client.on('message', async message => {
	const { channel, content, guild, author } = message

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
			claimChannelCache[guild.id] = newChannel.id

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

	if (command === 'thread') {
		let claimthreadData = claimThreadCache[guild.id]

		if (!claimthreadData) {
			console.log('FETCHING FROM DATABASE')
			await mongo().then(async (mongoose) => {
				try {
					const result = await claimthreadSchema.findOne({ _id: guild.id })

					claimThreadCache[guild.id] = claimthreadData = result.claimthread
				} catch (e) {
					message.reply('You have to set a claimthread first! Use ct!setthread')
				} finally {
					mongoose.connection.close()
				}
			});
		}

		const claimthreadUrl = claimthreadData[0]
		const claimthreadTitle = claimthreadData[1]

		const embedThread = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(claimthreadTitle)
			.setURL(claimthreadUrl)
			.setAuthor('ISFL Claim Thread Watcher', 'https://i.imgur.com/fPW1MS5.png')
			.setThumbnail('https://i.imgur.com/fPW1MS5.png');

		channel.send(embedThread);
	}

	if (command === 'setthread') {
		if (!author.id == '391332654399619073')
			message.reply('Sorry bro, only tMuse the God can add a thread to be watched.')
		if (!args[0] || !args[1]) {
			message.reply('You have to provide the URL and the Title!\neg: ct!setthread https://forums.sim-football.com/ S25-Claim-Thread')
			return;
		} else {

			await mongo().then(async (mongoose) => {
				try {
					await claimthreadSchema.findOneAndUpdate({
						_id: args[0]
					}, {
						_id: args[0],
						title: args[1],
						lastpost: ""
					}, {
						upsert: true
					})
					channel.send(`Added ${args[1]} with the url ${args[0]} to the list of watched threads`)
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
		let claimchannelId = claimChannelCache[guild.id]

		if (!claimchannelId) {
			console.log('FETCHING FROM DATABASE')
			await mongo().then(async (mongoose) => {
				try {
					const result = await claimchannelSchema.findOne({ _id: guild.id })

					claimChannelCache[guild.id] = claimchannelId = result.channelId
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



async function checkThreads() {
	let threads

	await mongo().then(async (mongoose) => {
		try {

			let result = await claimthreadSchema.find()
			threads = result

		} finally {
			mongoose.connection.close()
		}
	});

	for (const value of Object.values(threads)) {
		let url = value.toObject()['_id'] + '&action=lastpost'
		console.log(`URL: ${url}`)

		rp(url)
			.then(function(response) {
				console.log(respone.finalUrl);
			})
	}
}

client.login(config.token);
