const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('./config.json')

let prefix = config.prefix

let claimChannel = null;

client.once('ready', () => {
	console.log('Ping Pong Bot Loaded!');
});

client.on('message', async message => {
	if (!message.content.startsWith(prefix) || message.author.bot)	return;
	
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
				claimChannel = channel
				claimChannel.send("I found it! I will post the claims i find in here!");
		}
	}
	
	if (command === 'claim') {
		if (claimChannel == null) {
			message.reply(`You have to set a channel for me to post the claims first!\n
			use ${prefix}channel #tag-a-channel to set a channel for me to post in.`);
			return;
		} else {
			claimChannel.send("Here is your new claim!");
		}
	}
});

function getChannelFromMention(mention) {
	if (!mention) return;
	
	if (mention.startsWith('<#') && mention.endsWith('>')) {
		mention = mention.slice(2,-1)
		
		if (mention.startsWith('!')) {
		mention = mention.slice(1);
		}
		
		return client.channels.cache.get(mention)
	}
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
