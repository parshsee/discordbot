const Quote = require('../database/models/quotes');
// const idNumber = db call || 1;

async function addQuote(message, args) {
	// Gets the first & last names (capitalizing the first letter in each)
	// The rest of the args should be the quote
	const userFirstName = args[0].charAt(0).toUpperCase() + args[0].slice(1);
	const userLastName = args[1].charAt(0).toUpperCase() + args[1].slice(1);
	const userQuote = args.slice(2).join(' ');



}

async function removeQuote(message, args) {

}


module.exports = {
	name: 'quote',
	aliases: [],
	description: 'Adds or Removes a quote from the bot',
	args: true,
	usage: '\n[add] [first name] [last name] [quote] **OR** \n[remove] [ID]',
	// eslint-disable-next-line no-unused-vars
	execute(message, args) {
		// Get the first argument and remove it from array
		const firstArg = args.shift().toLowerCase();

		if(firstArg === 'add') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (add + 3 args)
			if(args.length < 3) {
				return message.channel.send('Command needs at least four (4) arguments, run help command for more info');
			}
			// Call addQuote function to add to database
			addQuote(message, args);
		} else if(firstArg === 'remove') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (remove + 1 args)
			if(args.length !== 1) {
				return message.channel.send('Command needs two (2) arguments, run help command for more info');
			}
			// Call removeQuote function to remove from database
			removeQuote(message, args);
		} else {
			return message.channel.send('Add or Remove not found. Use ia!help [command] for proper usage');
		}
	},
};