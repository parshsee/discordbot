const Birthday = require('../database/models/birthdays');

async function addBirthday(message, args) {
	// Gets the first & last names (capitalizing the first letter in each)
	// Gets the birthday
	// Gets each part of the birthday in an array (month, day, year)
	const userFirstName = args[0].charAt(0).toUpperCase() + args[0].slice(1);
	const userLastName = args[1].charAt(0).toUpperCase() + args[1].slice(1);
	const userBirthdate = args[2];
	const birthdateArray = userBirthdate.split('/');

	// Check if date is an actual date  || If there are only three elements in array
	// Only checks 01/01/1970 to future || (month, day, year)
	if(!Date.parse(userBirthdate) || birthdateArray.length !== 3) {
		return message.channel.send('Birthday not recognized. Make sure it is a valid date in the correct format (mm/dd/yyyy)');
	}

	// Convert the users date to the correct format
	// Set the hours, minutes, seconds, milliseconds to 0
	// (UTC time is 4 hours ahead of EST so it saves as +4 hours)
	const date = new Date(birthdateArray[2], birthdateArray[0] - 1, birthdateArray[1]);
	date.setHours(0, 0, 0, 0);

	// Get the current date
	// Set the hours, minutes, seconds, milliseconds to 0
	const currentDate = new Date();
	currentDate.setHours(0, 0, 0, 0);

	// Check if the users date is ahead of the current date
	// i.e Person not born yet
	if(date > currentDate) {
		return message.channel.send('Birthday not recognized. Please enter a valid date.');
	}

	// Construct a new birthday document from the model
	const birthday = new Birthday({
		firstName: userFirstName,
		lastName: userLastName,
		birthday: date,
	});


	// Save the birthday to the database
	(async () => {
		try {
			await birthday.save();
			console.log('Birthday added to Database');
			return message.channel.send('Birthday Added Successfully');
		} catch (err) {
			console.log('error: ' + err);
			return message.channel.send('Error saving birthday.');
		}
	})();
}

async function removeBirthday(message, args) {
	// Gets the first & last names (capitalizing the first letter in each)
	const userFirstName = args[0].charAt(0).toUpperCase() + args[0].slice(1);
	const userLastName = args[1].charAt(0).toUpperCase() + args[1].slice(1);

	// Creates a query finding and deleting the first occurence matching the entered first & last name
	// Gets the document using await for the Promise
	const query = Birthday.findOneAndDelete({ firstName: userFirstName, lastName: userLastName });
	const doc = await query;

	// If doc is null (search result failed) return error message
	if(!doc) return message.channel.send('User could not be found. Please make sure their birthday is in ia!bdays and the name is typed correctly');

	// Get the first and last names from the document
	const { firstName, lastName } = doc;

	console.log('Birthday removed from Database');
	// Return a message saying deletion was successful
	return message.channel.send(`${firstName} ${lastName}'s birthday has been removed from database.`);
}

module.exports = {
	name: 'bday',
	aliases: [],
	description: 'Adds or removes a birthday to remember',
	args: true,
	usage: 'add [first name] [last name] [mm/dd/yyyy] --- Adds the persons name and birthday to the bot' +
				'\n**•**ia!bday remove [first name] [last name] --- Removes the persons birthday from the bot',
	execute(message, args) {

		// Get the first argument and remove it from array
		const firstArg = args.shift().toLowerCase();

		if(firstArg === 'add') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (add + 3 args)
			if(args.length !== 3) {
				return message.channel.send('Command needs four (4) arguments, run help command for more info');
			}
			// Call addBirthday function to add to database
			addBirthday(message, args);
		} else if(firstArg === 'remove') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (remove + 2 args)
			if(args.length !== 2) {
				return message.channel.send('Command needs three (3) arguments, run help command for more info');
			}
			// Call to removeBirthday to remove from database
			removeBirthday(message, args);
		} else {
			return message.channel.send('Add or Remove not found. Use ia!help [command] for proper usage');
		}
	},
};