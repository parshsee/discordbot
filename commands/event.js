const Event = require('../database/models/events');

async function addEvent(message, args) {
	// MessageCollector w/ awaitMessages
	const userEventName = args.join(' ');
	console.log(userEventName);

	const userInfo = args;
	console.log(userInfo);

	userInfo.push(await questionOne(message));
	console.log(userInfo);
	userInfo.push(await questionTwo(message));
	console.log(userInfo);
	userInfo.push(await questionThree(message));
	console.log(userInfo);


	// After getting all info, save information in db and  create an embedded with info showing user

}

async function questionOne(message) {
	// User Info is an array of what the user has entered correctly
	message.channel.send('What day is the event? Please enter in mm/dd/yyyy format');

	const filter = m => m.author.id === message.author.id;
	try {
		const msg = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
		validateDate(msg);
		return msg;
	} catch (err) {
		console.log(err);
		if(err instanceof UserException) await retryCommand(message, err.message, err.position);
	}
}

async function questionTwo(message) {
	message.channel.send('What time is the event? Please enter in hh:mm AM/PM format');

	const filter = m => m.author.id === message.author.id;
	try {
		const msg = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
		validateTime(msg);
		return msg;
	} catch (err) {
		console.log(err);
		if(err instanceof UserException) await retryCommand(message, err.message, err.position);
	}

}

async function questionThree(message) {
	message.channel.send('Do you want to be reminded the day before, hour before, or both? Please enter \'Day\', \'Hour\', or \'Both\'');

	const filter = m => m.author.id === message.author.id;
	try {
		const msg = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
		validateReminderType(msg);
		return msg;
	} catch (err) {
		console.log(err);
		if(err instanceof UserException) await retryCommand(message, err.message, err.position);
	}
}

function validateDate(msg) {
	console.log(msg);
	if(msg === 'hello') console.log('world');
	else throw new UserException('Date has passed or invalid format', 1);
}

function validateTime(msg) {
	console.log(msg);
	throw new UserException('Time invalid', 2);
}

function validateReminderType(msg) {
	console.log(msg);
	throw new UserException('Not proper response', 3);
}

function UserException(errMsg, position) {
	this.message = errMsg;
	this.position = position;
	this.name = 'UserException';
}

async function retryCommand(message, errMsg, position) {
	const filter = m => m.author.id === message.author.id;

	try {
		message.channel.send(errMsg);
		const msg2 = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });

		console.log(msg2.first().content);

		if(msg2.first().content.toLowerCase() === 'y') {
			if(position === 1) questionOne(message);
			if(position === 2) questionTwo(message);
			if(position === 3) questionThree(message);
		} else if(msg2.first().content.toLowerCase() === 'n') {
			message.channel.send('Command cancelled.');
		} else {
			message.channel.send('Incorrect Response. Command Cancelled');
		}
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