module.exports = {
	name: 'quotes',
	aliases: [],
	description: 'Gets a random quote, specific quote, or lists all quotes',
	args: false,
	usage: ' **OR** \nia!quotes [first name] [last name] **OR** \nia!quotes [ID] **OR** \nia!quotes list',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		console.log(message, args);
	},
};