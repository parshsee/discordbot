const Event = require('../database/models/events');

// Initalize userInfo globally
let userInfo = [];

async function addEvent(message, args) {
	// Get event name as string
	const userEventName = args.join(' ');

	// Go through each question, catch an error (thrown or timeout)
	try {
		await questionOne(message);
		await questionTwo(message);
		await questionThree(message);
		await questionFour(message);
	} catch (err) {
		// If error is UserException, ask them to retry
		if (err instanceof UserException) {
			await retryCommand(message, err.message, err.position);
		// Else it's timeout error, can't ask to retry here
		} else {
			message.channel.send('No response given. Command timed out.');
			// Since global variable, reset it at the end
			userInfo = [];
		}
	}
	// After getting all info, save information in db and  create an embedded with info showing user
	// userInfo[0] = mm/dd/yyyy
	// userInfo[1] = hh:mm am/pm
	// userInfo[2] = [ID1, ID2, ID3, ...]
	// userInfo[3] = day/hour/both
	// Use 0 and 1 to get Date (convert am/pm to Date?)

	// If the array is empty (timeout), return
	if(!userInfo.length) return;

	// Convert 12 hour time to 24 hours
	const convertTime12to24 = (time12h) => {
		const merideim = time12h.slice(time12h.length - 2);
		// eslint-disable-next-line prefer-const
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
	const userTime = convertTime12to24(userInfo[1]);
	const userMentionArr = userInfo[2];
	const userReminderType = userInfo[3];

	// Split the date to get day, month, year
	// Create Date type with information
	const userDateArr = userDate.split('/');
	const date = new Date(userDateArr[2], userDateArr[0] - 1, userDateArr[1]);

	// Split the time to get hour, minute
	// Set time for date
	const userTimeArr = userTime.split(':');
	date.setHours(userTimeArr[0], userTimeArr[1]);

	// Create a query getting all documents, sorting by id
	// Await the query to the array of document objects
	const query = Event.find().sort({ eventId: 1 });
	const doc = await query;

	// Check if the array is empty (meaning nothing in db)
	// True = Get the id of the last entry and add 1
	// False = Set the id to 1
	const idNumber = doc.length ? doc[doc.length - 1].eventId + 1 : 1;

	// Construct a new event document from the model
	const event = new Event({
		eventId: idNumber,
		eventName: userEventName,
		eventDate: date,
		eventAuthor: message.author.id,
		eventPeople: userMentionArr,
		reminderType: userReminderType,
	});

	// Save the Event to the database
	(async () => {
		try {
			await event.save();
			console.log('Event added to Database');
			return message.channel.send('Event Added Successfully');
		} catch (err) {
			console.log('error: ' + err);
			return message.channel.send('Error saving event.');
		}
	})();

	// Reset the array
	userInfo = [];
}

async function questionOne(message) {
	// Send message asking for date
	message.channel.send('What day is the event? Please enter in mm/dd/yyyy format');

	// Create a filter where the responses author has to be the same as the once who started the command
	const filter = m => m.author.id === message.author.id;
	// Create await message, waiting 2 minutes for 1 message from the author
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });
	// Validate the message recieved
	const userDate = validateDate(msg);
	// Add to array
	userInfo.push(userDate);
}

async function questionTwo(message) {
	// Send message asking for time
	message.channel.send('What time is the event? Please enter in hh:mm AM/PM format');

	// Create a filter where the responses author has to be the same as the once who started the command
	const filter = m => m.author.id === message.author.id;
	// Create await message, waiting 2 minutes for 1 message from the author
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });
	// Validate the message recieved
	const userTime = validateTime(msg);
	// Add to array
	userInfo.push(userTime);
}

async function questionThree(message) {
	// Send message asking for participants
	message.channel.send('Mention (@) all participants included in the event other than you. If no other participants enter \'none\'');

	// Create a filter where the responses author has to be the same as the once who started the command
	const filter = m => m.author.id === message.author.id;
	// Create await message, waiting 2 minutes for 1 message from the author
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });
	// Validate the message recieved
	const userMentions = validateParticipants(msg);
	// Add to array
	userInfo.push(userMentions);
}

async function questionFour(message) {
	// Send message asking for when they want to be reminded
	message.channel.send('Do you want to be reminded the day before, hour before, or both? Please enter \'Day\', \'Hour\', or \'Both\'');

	// Create a filter where the responses author has to be the same as the once who started the command
	const filter = m => m.author.id === message.author.id;
	// Create await message, waiting 2 minutes for 1 message from the author
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });
	// Validate the message recieved
	const userType = validateReminderType(msg);
	// Add to array
	userInfo.push(userType);
}

// Checks if date is correct
// Checks if date is after current date
function validateDate(msg) {
	// Get the actual response
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
	// Get first entry from message and replace any whitespaces
	const userTime = msg.first().content.replace(/\s+/g, '');
	// Regex for checking correct time format (##:##am/pm)
	const re = /^\d{1,2}:\d{2}([ap]m)$/i;

	// Check if time is in correct format
	if(!userTime.match(re)) {
		throw new UserException('Invalid time format', 2);
	}

	// Check if time is realistic (0-12 : 0 - 5, 0 - 9)
	const onlyTime = userTime.substring(0, userTime.length - 2).split(':');

	if(onlyTime[0] < 0 || onlyTime[0] > 12 || onlyTime[1] < 0 || onlyTime[1] > 59) {
		throw new UserException('Time out of bounds', 2);
	}

	return userTime;
}

function validateParticipants(msg) {
	// Check if response is none, return 'none'
	if(msg.first().content.toLowerCase() === 'none') return msg.first().content;

	// Create array of participant IDs from message
	// IDs look like: <@12345678910>
	const userMentionArr = msg.first().content.split(' ');

	// Loop through array removing brackets, leaving only ID #s
	const mentionsArr = userMentionArr.map(mention => {
		if(mention.startsWith('<@') && mention.endsWith('>')) {
			mention = mention.slice(2, -1);

			if(mention.startsWith('!')) {
				mention = mention.slice(1);
			}
		} else {
			// If it's not an ID throw exception
			throw new UserException('Not valid user ID', 3);
		}

		return mention;
	});

	return mentionsArr;
}

function validateReminderType(msg) {
	// Get response and make it lowercase
	const userType = msg.first().content.toLowerCase();

	// If response isn't one of three options throw exception
	if(userType !== 'hour' && userType !== 'day' && userType !== 'both') {
		throw new UserException('Not proper response', 4);
	}

	return userType;
}

// Exception function takes message and position
// Message = Error message to display
// Position = Which question it happened in
function UserException(errMsg, position) {
	this.message = errMsg;
	this.position = position;
	this.name = 'UserException';
}

// Function to let user retry if there was a validation error
async function retryCommand(message, errMsg, position) {
	// Create a filter where the responses author has to be the same as the once who started the command
	const filter = m => m.author.id === message.author.id;

	try {
		// Send the error message along with asking them to retry
		message.channel.send(errMsg + ' __Retry? (Y/N)__');
		// Create await message, waiting 2 minutes for 1 message from the author
		const msg2 = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });

		// This was the best way I found to do it :(
		// If they want to retry use position to put in correct question
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
		// If they don't want to continue, cancel command & clear/reset userInfo
		} else if (msg2.first().content.toLowerCase() === 'n') {
			message.channel.send('Command cancelled.');
			userInfo = [];
		// If they give any other response, cancle command & clear/reset userInfo
		// Can't ask them to retry here
		} else {
			message.channel.send('Incorrect Response. Command Cancelled');
			userInfo = [];
		}
	} catch (err) {
		// If error is UserException go back to retry message
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
	// Check if id is a number
	if (isNaN(args[0])) return message.channel.send('Please enter a valid ID number');

	// Get the id number from the args
	const idNumber = args[0];

	// Create a query finding and deleting the doc with the id number
	// Await the query to get the document that was deleted
	const query = Event.findOneAndDelete({ eventId: idNumber });
	const doc = await query;

	// If document is null (search result failed) return error message
	if (!doc) return message.channel.send('Event could not be found. Please make sure the event is in ia!events and that it is typed correctly ');

	// Destructure the first and last name from the doc object
	const eventName = doc.eventName;

	// Call to update the ids for the remaining docs
	updateCollectionIDs();

	// Return a message saying deletion was successful
	console.log('Event removed from Database');
	return message.channel.send(`${eventName} has been removed from database.`);

}

// After removing an event, go through the collection
// Update all ids to be in order
// Solves issue of having ids [1, 2, 3, 4] deleting id 3, and now ids show as [1, 2, 4]
async function updateCollectionIDs() {
	// Get number of documents in collection
	const numberOfDocs = await Event.countDocuments();

	for(let i = 0; i < numberOfDocs; i++) {
		// Find all documents matching the condition (id > i)
		// Update the first documents id to be i + 1
		// Function takes a filter, an update, and a callback
		Event.updateOne(
			{ eventId: { $gt:i } },
			{ eventId: i + 1 },
			(err) => {
				if (err) console.log(err);
			});
	}
}

module.exports = {
	name: 'event',
	aliases: ['schedule', 'remind'],
	description: 'Adds or Removes an event from the bot\n__*Can not be used as DM*__',
	args: true,
	usage: 'add [event name] --- Adds an event' +
			'\n**•**ia!event remove [ID] --- Removes an event',
	execute(message, args) {
		if(message.channel.type === 'dm') return message.channel.send('This command can\'t be used as a DM');

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