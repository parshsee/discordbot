module.exports = {
	name: 'stats',
	aliases: ['server'],
	description: 'Show information on users or the server',
	args: false,
	execute(message, args) {

		console.log(message, args);
	},
};