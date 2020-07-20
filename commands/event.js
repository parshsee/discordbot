const Event = require('../database/models/events');

async function addEvent(message, args) {
	// MessageCollector w/ awaitMessages
	const userEventName = args.join(' ');
	console.log(userEventName);

	const userInfo = args;
	console.log(userInfo);

	try {
		//userInfo.push(await questionOne(message));
		//console.log(userInfo);
		//userInfo.push(await questionTwo(message));
		//console.log(userInfo);
		userInfo.push(await questionThree(message));
		console.log(userInfo);
	} catch (err) {
		if (err instanceof UserException) {
			message.channel.send(err.message);
			// await retryCommand(message, err.message, err.position);
		} else {
			console.log('This is a timeout error');
			message.channel.send('This is a timeout error');
			console.log(err);
		}
	}



	// After getting all info, save information in db and  create an embedded with info showing user

}

async function questionOne(message) {
	// User Info is an array of what the user has entered correctly
	message.channel.send('What day is the event? Please enter in mm/dd/yyyy format');

	const filter = m => m.author.id === message.author.id;

	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] });
	return await validateDate(msg);

}

async function questionTwo(message) {
	message.channel.send('What time is the event? Please enter in hh:mm AM/PM format');

	const filter = m => m.author.id === message.author.id;
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
	return await validateTime(msg);

}

async function questionThree(message) {
	message.channel.send('Add the IDs or mention any participants included in the event. If no other participants enter \'none\'');

	const filter = m => m.author.id === message.author.id;
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
	return await validateParticipants(msg);

}

async function questionFour(message) {
	message.channel.send('Do you want to be reminded the day before, hour before, or both? Please enter \'Day\', \'Hour\', or \'Both\'');

	const filter = m => m.author.id === message.author.id;
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
	await validateReminderType(msg);
	return msg;

}

// Checks if date is correct
// Checks if date is after current date
async function validateDate(msg) {
	const userDate = msg.first().content;
	const dateArr = userDate.split('/');
	// Check if date is an actual date  || If there are only three elements in array
	// Only checks 01/01/1970 to future || (month, day, year)
	if(!Date.parse(userDate) || dateArr.length !== 3) {
		throw new UserException('Date not recognized. Make sure it is a valid date in the correct format (mm/dd/yyyy)', 1);
	}

	// Convert the users date to the correct format
	// Set the hours, minutes, seconds, milliseconds to 0
	// (UTC time is 4 hours ahead of EST so it saves as +4 hours)
	const date = new Date(dateArr[2], dateArr[0] - 1, dateArr[1]);
	date.setHours(0, 0, 0, 0);

	// Get the current date
	// Set the hours, minutes, seconds, milliseconds to 0
	const currentDate = new Date();
	currentDate.setHours(0, 0, 0, 0);

	// Check if the users date is ahead of the current date
	// i.e Person not born yet
	if(date < currentDate) {
		throw new UserException('Date already passed. Please enter a valid date.', 1);
	}

	return msg.first().content;

}

async function validateTime(msg) {
	// Get first entry from message and replace any whitespaces
	const userTime = msg.first().content.replace(/\s+/g, '');
	// Regex for checking correct time format (##:##am/pm)
	const re = /^\d{1,2}:\d{2}([ap]m)?$/i;

	// Check if time is in correct format
	if(!userTime.match(re)) {
		throw new UserException('Invalid time format', 2);
	}

	// Check if time is realistic (0-12 : 0 - 5, 0 - 9)
	const merideim = userTime.slice(userTime.length - 2);
	const onlyTime = userTime.substring(0, userTime.length - 2).split(':');

	if(onlyTime[0] < 0 || onlyTime[0] > 12 || onlyTime[1] < 0 || onlyTime[1] > 59) {
		throw new UserException('Time out of bounds', 2);
	}

	return msg.first().content;

}

async function validateParticipants(msg) {
	console.log(msg.first().content);
	const userMentionArr = msg.first().content.split(' ');

	const mentionsArr = userMentionArr.map(mention => {
		if(mention.startsWith('<@') && mention.endsWith('>')) {
			mention = mention.slice(2, -1);

			if(mention.startsWith('!')) {
				mention = mention.slice(1);
			}
		} else {
			throw new UserException('Not valid user ID', 3);
		}

		return mention;
	});

	return mentionsArr;

}

async function validateReminderType(msg) {
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

		if (msg2.first().content.toLowerCase() === 'y') {
			if (position === 1) questionOne(message);
			if (position === 2) questionTwo(message);
			if (position === 3) questionThree(message);
		} else if (msg2.first().content.toLowerCase() === 'n') {
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

		if (firstArg === 'add') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (add + 1 args)
			if (args.length < 1) {
				return message.channel.send('Command needs at least two (2) arguments, run help command for more info');
			}
			// Call addEvent function to add to database
			addEvent(message, args);
		} else if (firstArg === 'remove') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (remove + 1 args)
			if (args.length !== 1) {
				return message.channel.send('Command needs two (2) arguments, run help command for more info');
			}
			// Call removeEvent function to remove from database
			removeEvent(message, args);
		} else {
			return message.channel.send('Add or Remove not found. Use ia!help [command] for proper usage');
		}
	},
};