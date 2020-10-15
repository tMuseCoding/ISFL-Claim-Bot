const Discord = require('discord.js');
const client = new Discord.Client();
let prefix = 'ct!';

client.once('ready', () => {
	console.log('Ping Pong Bot Loaded!');
});

client.on('message', message => {
	if (!message.content.startsWith(prefix))
		return;
		
	let messageContent = message.content.replace(prefix,'')
		
	if (messageContent === 'Ping') {
		message.channel.send('Pong!');
	}
	
	if (messageContent === 'invite') {
		replyWithInvite(message)
	}
});

async function replyWithInvite(message) {
	let invite = await message.channel.createInvite(
		{
		maxAge: 10*60*1000,
		maxUses: 5
		}
		`Requested by ${message.author.tag}`
	)
	.catch(console.log);
	
	message.channel.send(invite ? `You can invite me with this link! ${invite}` : "There was an error creating the invite link.")
}

client.login('NzY2MjIzNTE4NjU5NzcyNDE2.X4gPQg.KSehCG8Ld0Dvn8ItLAZbMSZM62g');