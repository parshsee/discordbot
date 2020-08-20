// Require dotenv and get the config variables, defined in our .env
require('dotenv').config();
// Require Node native filesystem module
const fs = require('fs');
// Require the Discord.js module
const Discord = require('discord.js');
// Require the database connection to MongoDB
const database = require('./database/database.js');
// Require the birthday collection from MongoDB
const Birthday = require('./database/models/birthdays');
// Require the event collection from MongoDB
const Event = require('./database/models/events');
// Create a new Discord client (bot)
const client = new Discord.Client();
client.commands = new Discord.Collection();
// Return an array of all filenames in the directory with .js ending
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles) {
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}

// When the client is ready, run this code
// This event only triggers once, at the very beginning when logging in (hence the 'once')
client.once('ready', () => {
	client.user.setUsername('Immature Bot');
	client.user.setActivity('you | ia!help', { type: 'WATCHING' });
	console.log('Ready!');

	// Make the connection to MongoDB
	// Async/Await instead of Then/Catch
	// Try/Catch to get any errors from await
	// https://stackoverflow.com/questions/54890608/how-to-use-async-await-with-mongoose/54892088
	(async () => {
		try {
			await database;
			console.log('Connected to MongoDB!');
		} catch (err) {
			console.log('error: ' + err);
		}
	})();

	// https://stackoverflow.com/questions/45120618/send-a-message-with-discord-js
	// Freebies Channel: 	In .env file
	// Gen Channel: 		In .env file
	// Test Server Gen Channel: 569279064255496227
	// 1000 = 1 sec, 10000 = 10 sec, 60000 = 1 minute, 3600000 = 1 hour, 86400000 = 24 hours
	const genChannel = client.channels.cache.get(`${process.env.GEN_CHANNEL_ID}`);
	const testServerGenChannel = client.channels.cache.get(`569279064255496227`);

	// Sets an interval of milliseconds, to run the birthdayChecker code
	setInterval(() => birthdayChecker(genChannel), 86400000);

	setInterval(() => scheduleChecker(testServerGenChannel), 60000);
});


client.on('message', message => {
	// If the message doesn't start with the prefix || This bot sent the message, exit
	// Updated to check for Ia and IA command
	if(!message.content.toLowerCase().startsWith(process.env.PREFIX) || message.author.bot) return;

	// Slices off prefix (removes) and splits everything seperated by space into an array (regex accounts for multiple spaces)
	const args = message.content.slice(process.env.PREFIX.length).split(/ +/);
	// Gets the command, which should be the first in the array
	// Shift stores the command and removes it from the array
	// This is just the command name (i.e server, ping, user-info)
	const commandName = args.shift().toLowerCase();

	// The actual command object (file w/ properties)
	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	// If there isn't a command with that name, exit
	if(!command) return;

	// Checks args property of relevant command and to see if any args were passed
	// If command requires arguments and no arguments provided (just command)
	if(command.args && !args.length) {
		let reply = 'you didn\'t provide any arguments!';

		if(command.usage) {
			reply += `\nThe proper usage would be: '${process.env.PREFIX}${command.name} ${command.usage}'`;
		}

		return message.reply(reply);
	}


	// Try to run the commands execute property
	// Catch and log any error and reply that there was a problem
	try {
		command.execute(message, args);
	} catch (error) {
		console.log(error);
		message.reply('There was an error trying to execute that command!');
	}

});

// Client detects when a person joins (is added) to the guild
// Passes a member object
client.on('guildMemberAdd', member => {
	// Get the member log channel
	const memberLogChannel = client.channels.cache.get(`${process.env.MEMBER_LOG_CHANNEL_ID}`);
	// Create and send an embed that the user has joined
	const embed = new Discord.MessageEmbed()
		.setFooter(`${member.user.tag} has joined.`, member.user.displayAvatarURL());

	// Log the joined user
	console.log(`${member.user.tag} has joined.`);
	memberLogChannel.send(embed);
});

// Client detects when a person leaves (is removed) from the guild
// Passes a member object
client.on('guildMemberRemove', member => {
	// Get the member log channel
	const memberLogChannel = client.channels.cache.get(`${process.env.MEMBER_LOG_CHANNEL_ID}`);
	// Create and send an embed that the user has left
	const embed = new Discord.MessageEmbed()
		.setFooter(`${member.user.tag} has left.`, member.user.displayAvatarURL());

	// Log the person that left
	console.log(`${member.user.tag} has left.`);
	memberLogChannel.send(embed);
});

// Login in server with app token should be last line of code
client.login(process.env.TOKEN);

process.on('unhandledRejection', error => {
	console.error('Unhandled Promise Rejection: ', error);
});

async function birthdayChecker(genChannel) {
	// Create a query getting all documents from Birthday collection
	// Await query to get array of document objects
	const query = Birthday.find();
	const doc = await query;

	// Get the current date
	// Get the current month & day in mm/dd format
	// Get the current year
	const currentDate = new Date();
	const currentMonthDay = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
	const currentYear = currentDate.getFullYear();

	// For every birthday object get the date in mm/dd format and year
	doc.forEach((birthday) => {
		const birthdayDate = `${birthday.birthday.getMonth() + 1}/${birthday.birthday.getDate()}`;
		const birthdayYear = birthday.birthday.getFullYear();

		// If the birthday month and date are the same as the current month and day
		// Send a message to the general channel
		if (birthdayDate === currentMonthDay) {
			genChannel.send(`@everyone, ${birthday.firstName} ${birthday.lastName} turns ${currentYear - birthdayYear} today!`);
			console.log('There is a birthday today');
		}
	});

}

async function scheduleChecker(testServerGenChannel) {
	// Create a query getting all documents from Event collection sorting by id
	// Await query to get array of document objects
	const query = Event.find().sort({ eventId: 1 });
	const doc = await query;

	const today = new Date();
	today.setSeconds(0, 0);

	const tomorrow = new Date();
	tomorrow.setDate(today.getDate() + 1);
	tomorrow.setSeconds(0, 0);

	const hourAhead = new Date();
	hourAhead.setHours(today.getHours() + 1);
	hourAhead.setSeconds(0, 0);

	console.log(today.toLocaleString());
	console.log(tomorrow.toLocaleString());
	console.log(hourAhead.toLocaleString());

	doc.forEach(async event => {
		const { eventName, eventDate, reminderType, eventAuthor } = event;
		let eventPeople = event.eventPeople;

		// If there's only 1 element in the array and it's 'none', remove it
		if(eventPeople.length === 1 && eventPeople[0] === 'none') eventPeople.pop();
		// Add the author ID to the beginning of the array
		eventPeople.unshift(eventAuthor);
		// Mutate (modify) the array, changing each ID (person) to allow Discord to @ them
		eventPeople = eventPeople.map((person) => {
			person = `<@${person}>`;
			return person;
		});

		if(reminderType === 'day') {
			if(tomorrow.toLocaleString() === eventDate.toLocaleString()) {
				return testServerGenChannel.send(`:alarm_clock: ${eventPeople} --- ${eventName} is in 24 hours! :alarm_clock:`);
			}
		} else if(reminderType === 'hour') {
			if(hourAhead.toLocaleString() === eventDate.toLocaleString()) {
				return testServerGenChannel.send(`:alarm_clock: ${eventPeople} --- ${eventName} is in 1 hour! :alarm_clock:`);
			}
		} else if(reminderType === 'both') {
			if(tomorrow.toLocaleString() === eventDate.toLocaleString()) {
				return testServerGenChannel.send(`:alarm_clock: ${eventPeople} --- ${eventName} is in 24 hours! :alarm_clock:`);
			} else if(hourAhead.toLocaleString() === eventDate.toLocaleString()) {
				return testServerGenChannel.send(`:alarm_clock: ${eventPeople} --- ${eventName} is in 1 hour! :alarm_clock:`);
			}
		}

		if(today.toLocaleString() === eventDate.toLocaleString()) {
			await Event.findOneAndDelete({ eventId: event.eventId });

			return testServerGenChannel.send(`:alarm_clock: ${eventPeople} --- ${eventName} starts now! :alarm_clock:`);
		}
	});


}