module.exports = {
	name: 'events',
	aliases: ['schedules, reminds'],
	description: 'Shows a list of all the events',
	args: false,
	usage: '',
	execute(message, args) {
		console.log(message, args);
	},
};