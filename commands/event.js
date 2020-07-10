const Event = require('../database/models/events');

async function addEvent(message, args) {
	// MessageCollector w/ awaitMessages
	const userEventName = args.join(' ');
	console.log(userEventName);

	message.channel.send('What day is the event? Please enter in mm/dd/yyyy format');
	message.channel.send('What time is the event? Please enter in hh:mm AM/PM format');

	const filter = m => m.author.id === message.author.id;
	try {
		const msg = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
		validateDate(msg);
	} catch (err) {
		console.log(err);
		if(err instanceof Error) console.log('Haha Poopy Pancakes');
		retryCommand(message, args);
	}
}

function validateDate(msg) {
	console.log(msg);
	throw new Error('Poop Pancakes');
}

async function retryCommand(message, args) {
	const filter = m => m.author.id === message.author.id;

	try {
		message.channel.send('You did not send a message on time. Retry? (Y/N)');
		const msg2 = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });

		console.log(msg2.first().content);

		if(msg2.first().content.toLowerCase() === 'y') addEvent(message, args);
		else if(msg2.first().content.toLowerCase() === 'n') message.channel.send('Command cancelled.');
		else message.channel.send('Incorrect Response. Command Cancelled');
	} catch (error) {
		message.channel.send('No response given. Command timed out.');
		console.log(error);
	}
}

async function removeEvent(message, args) {

}

module.exports = {
	name: 'event',
	aliases: ['schedule', 'remind'],
	description: 'Adds or Removes an event from the bot',
	args: true,
	usage: '\n[add] [event name] **OR** \n[remove] [ID]',
	execute(message, args) {
		// Get the first argument and remove it from array
		const firstArg = args.shift().toLowerCase();

		if(firstArg === 'add') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (add + 1 args)
			if(args.length < 1) {
				return message.channel.send('Command needs at least two (2) arguments, run help command for more info');
			}
			// Call addEvent function to add to database
			addEvent(message, args);
		} else if(firstArg === 'remove') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (remove + 1 args)
			if(args.length !== 1) {
				return message.channel.send('Command needs two (2) arguments, run help command for more info');
			}
			// Call removeEvent function to remove from database
			removeEvent(message, args);
		} else {
			return message.channel.send('Add or Remove not found. Use ia!help [command] for proper usage');
		}
	},
};