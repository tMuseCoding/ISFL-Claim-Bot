const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
	console.log('Ping Pong Bot Loaded!');
});

client.on('message', message => {
	if (message.content === 'Ping') {
		message.channel.send('Pong!');
	}
});

client.login('NzY2MjIzNTE4NjU5NzcyNDE2.X4gPQg.KSehCG8Ld0Dvn8ItLAZbMSZM62g');
