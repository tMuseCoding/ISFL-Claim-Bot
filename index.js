const Discord = require('discord.js');
const client = new Discord.Client();
let prefix = 'ct!';

let channelId;

client.once('ready', () => {
	console.log('Ping Pong Bot Loaded!');
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot)
		return;
	
	let args = message.content.slice(prefix.length).trim().split(/ +/);	
	let command = args.shift().toLowerCase();
		
	if (command === 'ping') {
		message.channel.send('Pong!');
	}
	
	if (command === 'invite') {
		replyWithInvite(message);
	}
	
	if (command === 'channel') {
		let channel = client.channels.cache.get(args[0]);
		if (channel == null) {
			message.reply("I can't see that channel!");
			return;
			} else {
				channel.send("I found it!");
		}
	}
});

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

client.login('NzY2MjIzNTE4NjU5NzcyNDE2.X4gPQg.KSehCG8Ld0Dvn8ItLAZbMSZM62g');
