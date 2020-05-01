// Using ` allows you to call varaibles into string like below.
// ` (above tab) is different from ' (quotes)
module.exports = {
	name: 'server',
	aliases: [],
	description: 'Displays server info!',
	args: false,
	// Space lets the usage show up when asking for it in commands
	usage: ' ',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		// Send back message to channel the message was sent in
		message.channel.send('This servers\'s name is:' + message.guild.name + '\nTotal Members: ' + message.guild.memberCount);
	},
};