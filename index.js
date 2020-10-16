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

	client.setInterval(checkThreads, 30000);
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
	var fetchedPost = ""
	var redirectedUrl = ""

	await mongo().then(async (mongoose) => {
		try {
			let result = await claimthreadSchema.find()
			threads = result

		} finally {
			mongoose.connection.close()
		}
	});

	for (const value of Object.values(threads)) {
		let originalurl = value.toObject()['_id']
		let url = originalurl + '&action=lastpost'
		let title = value.toObject()['title']
		let lastpost = value.toObject()['lastpost']
		
		if (!originalurl || originalurl == "") return;

		console.log(`URL: ${url} LAST POST: ${lastpost}`)

		const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"

		const _include_headers = function(body, response, resolveWithFullResponse) {
			return {
				'headers': response.headers,
				'data': body,
				'finalUrl': response.request.uri.href
			};
		};

		const options = {
			uri: url,
			followAllRedirects: true,
			method: 'get',
			gzip: true,
			transform: _include_headers,
			headers: {
				'User-Agent': userAgent
			},
		};

		await rp(options).then((response) => {
			redirectedUrl = response.finalUrl
			fetchedPost = new RegExp("(?<=&pid=).*?(?=#pid)").exec(redirectedUrl)
			console.log('FETCHED: ' + fetchedPost[0]);
		});

		if (lastpost == fetchedPost && fetchedPost != "") {
			console.log('old post')
		} else if (redirectedUrl != "" && fetchedPost != "") {
			console.log('new post')

			await mongo().then(async (mongoose) => {
				try {
					await claimthreadSchema.findOneAndUpdate({
						_id: originalurl
					}, {
						_id: originalurl,
						title: title,
						lastpost: fetchedPost[0]
					}, {
						upsert: true
					})
				} finally {
					mongoose.connection.close()
				}
			});

			console.log('FETCHING FROM DATABASE')
			await mongo().then(async (mongoose) => {
				try {
					let result = await claimchannelSchema.find()
					channels = result

				} finally {
					mongoose.connection.close()
				}
			});

			for (const value of Object.values(channels)) {
				let server = client.guilds.cache.get(value.toObject()['_id'])
				let claimchannelIdforserver = value.toObject()['channelId']

				console.log(`fetchedPost: ${fetchedPost}\nredirectedUrl: ${redirectedUrl}`)


				const embedNewClaim = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle(fetchedPost)
					.setURL(redirectedUrl)
					.setAuthor(redirectedUrl, 'https://i.imgur.com/fPW1MS5.png')
					.setDescription("I only check the thread every 5 minutes. Scroll up to make sure you don't mis anything!")
					.setThumbnail('https://i.imgur.com/fPW1MS5.png')

				server.channels.cache.get(claimchannelIdforserver).send(embedNewClaim)
			}
		} else
			console.log(`EMPTY!!!! fetchedPost: ${fetchedPost}\nredirectedUrl: ${redirectedUrl}`)
	}
}

client.login(config.token);
