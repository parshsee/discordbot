module.exports = {
	name: 'quote',
	aliases: [],
	description: 'Adds or Removes a quote from the bot',
	args: true,
	usage: '\n[add] [first name] [last name] [quote] **OR** \n[remove] [ID]',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		console.log(message, args);
	},
};