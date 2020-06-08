module.exports = {
	name: 'dailycute',
	aliases: ['cute', 'animal'],
	description: 'Sends a random cute animal image',
	args: false,
	usage: '',
	execute(message, args) {
		// Using this API: https://some-random-api.ml/
		console.log(message, args);
	},
};