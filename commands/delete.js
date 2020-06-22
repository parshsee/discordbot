module.exports = {
	name: 'delete',
	aliases: ['prune'],
	description: 'Deletes the last message or a given number of messages in the channel',
	args: false,
	usage: ' **OR** \nia!delete [# of messages]',
	execute(message, args) {
		console.log(message, args);
	},
};