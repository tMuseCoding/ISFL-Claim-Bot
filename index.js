const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('./config.json')
const mongo = require('./mongo')
const claimchannelSchema = require('./schemas/claimchannel-schema')
const claimthreadSchema = require('./schemas/claimthread-schema')
const subscribedrolesSchema = require('./schemas/subscribedroles-schema')

const rp = require('request-promise');

const prefix = config.prefix
const claimChannelCache = {}
const subscribedroleCache = {}

client.once('ready', async () => {
	console.log('ISFL Claim Bot Loaded!');

	await mongo().then((mongoose) => {
		try {
			console.log('Connected to mongo!');
		} finally {
			mongoose.connection.close();
		}
	});
	client.user.setActivity('Claim Threads', { type: 'WATCHING' })
	client.setInterval(checkThreads, 300000);
});

client.on('message', async message => {
	const { channel, content, guild, author } = message

	if (!content.startsWith(prefix) || author.bot) return;

	let args = content.slice(prefix.length).trim().split(/ +/);
	let command = args.shift().toLowerCase();

	if (command === 'invite') {
		replyWithInvite(channel);
		return;
	}

	if (!message.member.hasPermission("ADMINISTRATOR")) {
		message.reply("You have to be a server admin to set me up.")
		return;
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
					channel.send(`Found it! I will post the claims I find in ${newChannel}.`)
				} catch (e) {
					console.log(e)
					message.reply("Something went wrong! Try again.\nIf you keep seeing this error there might be a problem with the bot.")
				} finally {
					mongoose.connection.close();
				}
			});

		}
	}

	if (command === 'role') {
		let newRole = getRoleFromMention(args[0])
		if (newRole == null) {
			message.reply("You have to ping the role! Eg. ct!role @Testrole");
			return;
		} else {
			subscribedroleCache[guild.id] = newRole.id

			await mongo().then(async (mongoose) => {
				try {
					await subscribedrolesSchema.findOneAndUpdate({
						_id: guild.id
					}, {
						_id: guild.id,
						role: newRole.id,
					}, {
						upsert: true
					})
					message.reply(`Alright I will ping ${newRole.name} when a new claim comes out.`)
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
			var post = args[2]
			if (!post) {
				post = ""
				}
			await mongo().then(async (mongoose) => {
				try {
					await claimthreadSchema.findOneAndUpdate({
						_id: args[0]
					}, {
						_id: args[0],
						title: args[1],
						lastpost: post
					}, {
						upsert: true
					})
					let message = `Added ${args[1]} with the url ${args[0]} to the list of watched threads`
					if (post)
						message +=` last post is ${post}`
					channel.send(message)
				} catch (e) {
					console.log(e)
					message.reply("Something went wrong! Try again.\nIf you keep seeing this error there might be a problem with the bot.")
				} finally {
					mongoose.connection.close();
				}
			});

		}
	}
	
	if (command === 'permissions') {
		var mes = 'To use the ISFL Claim Thread Watcher you have to set the permissions for the channel you want the bot to post in.\n'
		mes = mes + 'The permissions needed are:\n***Read Messages***\n***Send Messages***\n***Embed Links***\n***Mention @.everyone, @.here, and All Roles***\n'
		mes = mes + 'if ANY of those permissions is missing the bot is unable to send any claims.\n\n'
		mes = mes + '***Make sure the bot has these permissions while you set it up!***'
		channel.send(mes)
	}
	
	if (command === 'help') {
		var helpmessage = '```ct!help - displays this exact code block... why did I put this here?\nct!permissions - a list of permissions you need for the bot to work flawlessly\n'
		helpmessage = helpmessage + 'ct!channel #YOUR-CHANNEL - set a channel to send the posts in\n'
		helpmessage = helpmessage + 'ct!role @.ROLE (Yes you have to ping them once!)- set a role to be pinged when a new claim is available, you don\'t have to specify a role if you don\'t want any ping\n'
		helpmessage = helpmessage + 'ct!invite - get the invite link```'

		channel.send(helpmessage)
	}
	
	if (command === 'checkpermissions') {
		const permissions = botPermissionsFor = channel.permissionsFor(guild.me)
		
		channel.send(permissions.toArray())
	}

	function getChannelFromMention(mention) {
		if (!mention) return;

		if (mention.startsWith('<#') && mention.endsWith('>')) {
			mention = mention.slice(2, -1)

			return client.channels.cache.get(mention)
		}
	}

	function getRoleFromMention(mention) {
		if (!mention) return;

		if (mention.startsWith('<@') && mention.endsWith('>')) {
			mention = mention.slice(2, -1)

			if (mention.startsWith('&'))
				mention = mention.slice(1)

			console.log(`FOUND ROLE: ${mention}`)
			return guild.roles.cache.get(mention)
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
	var threads
	var fetchedPost = ""
	var redirectedUrl = ""

	console.log("checking thread")

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

		if (!originalurl || originalurl == "") {
			console.log(originalurl)
			return;
		}


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
					await claimthreadSchema.updateOne(
						{ _id: originalurl },
						{$set: {lastpost: fetchedPost[0] }}
					)
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

				var subbedRole = ""

				console.log('FETCHING FROM DATABASE')
				await mongo().then(async (mongoose) => {
					try {
						let result = await subscribedrolesSchema.findOne({ _id: server.id })
						if (result)
							subbedRole = result.role

					} finally {
						mongoose.connection.close()
					}
				});


				const embedNewClaim = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle(`${title} - New Claim Available!`)
					.setURL(redirectedUrl)
					.setAuthor('ISFL Claim Thread Watcher', 'https://i.imgur.com/fPW1MS5.png')
					.setDescription("I only check the thread every 5 minutes. Scroll up to make sure you don't miss anything!")
					.setThumbnail('https://i.imgur.com/fPW1MS5.png')

				server.channels.cache.get(claimchannelIdforserver).send(embedNewClaim)
				if (subbedRole != "")
					server.channels.cache.get(claimchannelIdforserver).send(`<@&${subbedRole}>`)
			}
		} else
			console.log(`EMPTY!!!! fetchedPost: ${fetchedPost}\nredirectedUrl: ${redirectedUrl}`)
	}
}

client.login(config.token);
