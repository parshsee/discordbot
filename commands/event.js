const Event = require('../database/models/events');

let userInfo = [];

async function addEvent(message, args) {
	const userEventName = args.join(' ');

	// userInfo.push(userEventName);
	console.log(userInfo);

	try {
		await questionOne(message);
		console.log(userInfo);
		await questionTwo(message);
		console.log(userInfo);
		await questionThree(message);
		console.log(userInfo);
		await questionFour(message);
		console.log(userInfo);
	} catch (err) {
		if (err instanceof UserException) {
			// message.channel.send(err.message);
			await retryCommand(message, err.message, err.position);
		} else {
			message.channel.send('No response given. Command timed out.');
			userInfo = [];
		}
	}

	console.log('--------------End of addEvent Try/Catch-----------------');
	console.log(userInfo);

	message.channel.send('You are done');
	// After getting all info, save information in db and  create an embedded with info showing user
	// userInfo[0] = mm/dd/yyyy
	// userInfo[1] = hh:mm am/pm
	// userInfo[2] = [ID1, ID2, ID3, ...]
	// userInfo[3] = day/hour/both
	// Use 0 and 1 to get Date (convert am/pm to Date?)

	// If the array is empty (timeout), return
	if(!userInfo.length) return;

	const convertTime12to24 = (time12h) => {
		const merideim = time12h.slice(time12h.length - 2);
		let [hours, minutes] = time12h.substring(0, time12h.length - 2).split(':');

		if (hours === '12') {
			hours = '00';
		}

		if (merideim.toLowerCase() === 'pm') {
			hours = parseInt(hours, 10) + 12;
		}

		return `${hours}:${minutes}`;
	};
	const userDate = userInfo[0];
	let userTime = convertTime12to24(userInfo[1]);
	const userMentionArr = userInfo[2];
	const userReminderType = userInfo[3];
	console.log(userTime);

	// Create a query getting all documents, sorting by id
	// Await the query to the array of document objects
	const query = Event.find().sort({ id: 1 });
	const doc = await query;

	// Check if the array is empty (meaning nothing in db)
	// True = Get the id of the last entry and add 1
	// False = Set the id to 1
	const idNumber = doc.length ? doc[doc.length - 1].id + 1 : 1;

	const event = new Event({
		eventId: idNumber,
		eventName: userEventName,
		eventDate: ,
		eventAuthor: ,
		eventPeople: userMentionArr,
		reminderType: userReminderType,
	});

	

}

async function questionOne(message) {
	message.channel.send('What day is the event? Please enter in mm/dd/yyyy format');

	const filter = m => m.author.id === message.author.id;

	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });
	console.log(msg.first().content);
	const userDate = validateDate(msg);
	console.log('Date validated');
	userInfo.push(userDate);

	console.log('-------questionOne Done-------');
	console.log(userInfo);
}

async function questionTwo(message) {
	message.channel.send('What time is the event? Please enter in hh:mm AM/PM format');

	const filter = m => m.author.id === message.author.id;
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });
	const userTime = validateTime(msg);
	console.log('Time validated');
	userInfo.push(userTime);

	console.log('-------questionTwo Done-------');
	console.log(userInfo);
}

async function questionThree(message) {
	message.channel.send('Add the IDs or mention all participants included in the event. If no other participants enter \'none\'');

	const filter = m => m.author.id === message.author.id;
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });
	const userMentions = validateParticipants(msg);
	console.log('Participants validated');
	userInfo.push(userMentions);

	console.log('-------questionThree Done-------');
	console.log(userInfo);
}

async function questionFour(message) {
	message.channel.send('Do you want to be reminded the day before, hour before, or both? Please enter \'Day\', \'Hour\', or \'Both\'');

	const filter = m => m.author.id === message.author.id;
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });
	const userType = validateReminderType(msg);
	console.log('Reminder validated');

	userInfo.push(userType);
	console.log('-------questionFour Done-------');
	console.log(userInfo);
}

// Checks if date is correct
// Checks if date is after current date
function validateDate(msg) {
	console.log('In valdateDate');
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

	return userDate;

}

function validateTime(msg) {
	console.log('In validateTime');
	// Get first entry from message and replace any whitespaces
	const userTime = msg.first().content.replace(/\s+/g, '');
	// Regex for checking correct time format (##:##am/pm)
	const re = /^\d{1,2}:\d{2}([ap]m)$/i;

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

	return userTime;

}

function validateParticipants(msg) {
	console.log('In validateParticipants');
	if(msg.first().content.toLowerCase() === 'none') return msg.first().content;

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

function validateReminderType(msg) {
	console.log('In validateReminderType');
	const userType = msg.first().content.toLowerCase();

	if(userType !== 'hour' && userType !== 'day' && userType !== 'both') {
		throw new UserException('Not proper response', 4);
	}

	return userType;
}

function UserException(errMsg, position) {
	this.message = errMsg;
	this.position = position;
	this.name = 'UserException';
}

async function retryCommand(message, errMsg, position) {
	const filter = m => m.author.id === message.author.id;

	try {
		message.channel.send(errMsg + ' Retry? (Y/N)');
		const msg2 = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });

		console.log(msg2.first().content);

		if (msg2.first().content.toLowerCase() === 'y') {
			if(position === 1) {
				await questionOne(message);
				await questionTwo(message);
				await questionThree(message);
				await questionFour(message);
			} else if(position === 2) {
				await questionTwo(message);
				await questionThree(message);
				await questionFour(message);
			} else if(position === 3) {
				await questionThree(message);
				await questionFour(message);
			} else if(position === 4) {
				await questionFour(message);
			}
		} else if (msg2.first().content.toLowerCase() === 'n') {
			message.channel.send('Command cancelled.');
			userInfo = [];
		} else {
			message.channel.send('Incorrect Response. Command Cancelled');
			userInfo = [];
		}
	} catch (err) {
		if (err instanceof UserException) {
			await retryCommand(message, err.message, err.position);
		// If timeout after retry is called, the else gets called. No way to ask them to retry here.
		} else {
			message.channel.send('No response given. Command timed out.');
			userInfo = [];
		}
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