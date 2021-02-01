// Require dotenv and get the config variables, defined in our .env
require('dotenv').config();
// Require Node native filesystem module
const fs = require('fs');
// Require the Discord.js module
const Discord = require('discord.js');
// Require the Axios module
const axios = require('axios');
// Require the database connection to MongoDB
const database = require('./database/database.js');
// Require the birthday collection from MongoDB
const Birthday = require('./database/models/birthdays');
// Require the event collection from MongoDB
const Event = require('./database/models/events');
// Require the streamer collection from MongoDB
const Streamer = require('./database/models/streamers');
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

	// const genChannel = client.channels.cache.get(`${process.env.GEN_CHANNEL_ID}`);
	// const remindersChannel = client.channels.cache.get(`${process.env.REMINDERS_CHANNEL_ID}`);
	// const livePromotionChannel = client.channels.cache.get(`${process.env.LIVE_PROMOTION_CHANNEL_ID}`);
	let genChannel;
	let remindersChannel;
	let livePromotionChannel;

	client.guilds.cache.forEach(guild => {
		const guildChannelErrors = [];

		// Check if the guild has the required channels
		// Gets the first text channel, which usually is the general channel
		const hasGeneralChannel = guild.channels.cache.filter(channel => channel.type === 'text').first();
		// .find returns the value, which in this case is the Channel class, not a boolean
		const hasFreebiesChannel = guild.channels.cache.find(channel => channel.name.toLowerCase() === 'freebies');
		const hasRemindersChannel = guild.channels.cache.find(channel => channel.name.toLowerCase() === 'reminders');
		const hasLivePromotionChannel = guild.channels.cache.find(channel => channel.name.toLowerCase() === 'live-promotions');

		// Check if freebies channel exists
		// Else add error
		if(!hasFreebiesChannel) {
			guildChannelErrors.push('freebies');
		}

		// Check if freebies channel exists
		// Else add error
		if(!hasRemindersChannel) {
			guildChannelErrors.push('reminders');
		}

		// Check if freebies channel exists
		// Else add error
		if(!hasLivePromotionChannel) {
			guildChannelErrors.push('live-promotions');
		}

		// Check if guild is missing any channels
		if(guildChannelErrors.length > 0) {
			// Send message to the guilds general channel
			hasGeneralChannel.send('Creating required channels...');
			// Check if bot has permission to create channels
			// If not, send message asking for permission or for channels to be created
			if(!guild.me.hasPermission('MANAGE_CHANNELS')) {
				hasGeneralChannel.send('Don\'t have permission to create required channels. Follow these steps to fully use Immature Bot: ' +
										'\n1. Either create the required text channels manually OR give Immature Bot permission to manage channels when adding to server' +
										'\n2. Remove and re-add Immature Bot to server' +
										`\nMissing channels: ${guildChannelErrors.join(', ')}`);
			}

			// Create requried channels
			guildChannelErrors.forEach(missingChannel => {
				guild.channels.create(missingChannel, {
					type: 'text',

				}).then(channel => {
					channel.send('Text Channel Created');
					if(channel.name.toLowerCase() === 'reminders') remindersChannel = channel;
					if(channel.name.toLowerCase() === 'live-promotions') livePromotionChannel = channel;
				}).catch(error => {
					console.log(error);
				});
			});
		} else {
			remindersChannel = hasRemindersChannel;
			livePromotionChannel = hasLivePromotionChannel;
		}

		genChannel = hasGeneralChannel;
	});

	// 1000 = 1 sec, 10000 = 10 sec, 60000 = 1 minute, 3600000 = 1 hour, 86400000 = 24 hours
	// Sets an interval of milliseconds, to run the birthdayChecker code
	setInterval(async () => await birthdayChecker(genChannel), 86400000);
	console.log('Birthday Checker	:	Created');

	// Sets an interval of milliseconds, to run the scheduleChecker code
	setInterval(async () => await scheduleChecker(remindersChannel), 60000);
	console.log('Schedule Checker	:	Created');

	setInterval(async () => await twitchTokenValidator(), 60000);
	console.log('Twitch Token Checker	:	Created');

	setInterval(async () => await streamChecker(livePromotionChannel), 60000);
	console.log('Streamer Checker	:	Created');

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
	if(!command) return message.send('That command doesn\'t exist!');

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

// When received SIGNAL TERMINATION (sent when Heroku closes app, for update or other)
// Log the Twitch Token and continue to close app
process.on('SIGTERM', () => {
	console.log(`Twitch Token: ${process.env.TWITCH_TOKEN}`);
	process.exit();
});

// When recieved SIGNAL INTERUPPTED (sent when CTRL + C is used)
// Log the Twitch Token and continue to close app
process.on('SIGINT', () => {
	console.log(`Twitch Token: ${process.env.TWITCH_TOKEN}`);
	process.exit();
});

async function twitchTokenValidator() {
	// Given a token in header
	// Returns the client id, scopes, and expire time in seconds (remaining)
	try {
		const twitchValidator = (await axios({
			url: `${process.env.TWITCH_VALIDATION_API}`,
			method: 'GET',
			headers: {
				'Authorization': `OAuth ${process.env.TWITCH_TOKEN}`,
			},
		})).data;

		if(twitchValidator.expires_in > 0) {
			console.log(`Twitch Token Time Remaining: ${twitchValidator.expires_in}`);
		}

	} catch(error) {
		console.log('Call to Twitch Validator: Failure', error.response.data);
		if(error.response.data.status === 401 && error.response.data.message === 'invalid access token') {
			console.log('Token Expired, Retrieving New Token');
			await getTwitchToken();
		}
	}
}

async function getTwitchToken() {
	try {
		const twitchInfo = (await axios({
			url: `${process.env.TWITCH_TOKEN_API}`,
			method: 'POST',
			params: {
				'client_id': `${process.env.TWITCH_CLIENT_ID}`,
				'client_secret': `${process.env.TWITCH_CLIENT_SECRET}`,
				'grant_type': 'client_credentials',
			},
		})).data;

		console.log(`Old Twitch Token: ${process.env.TWITCH_TOKEN}`);
		process.env.TWITCH_TOKEN = twitchInfo.access_token;

	} catch(error) {
		console.log('Call to Twitch Token: Failure', error);
	}
}

async function birthdayChecker(genChannel) {
	// Create a query getting all documents from Birthday collection
	// Await query to get array of document objects
	const query = Birthday.find();
	const doc = await query;
	console.log('Birthday DB Called');

	// Get the current date
	// Get the current month & day in mm/dd format
	// Get the current year
	const currentDate = new Date();

	// Get dates for Daylight Saving Times (DST)
	const daylightSavingTimeStart = getDaylightSavingStartTime(currentDate.getFullYear());
	const daylightSavingTimeEnd = getDaylightSavingEndTime(currentDate.getFullYear() + 1);

	// Gets dates for Daylight Saving Times for Last Year
	const daylightSavingTimeStartLastYear = getDaylightSavingStartTime(currentDate.getFullYear() - 1);
	const daylightSavingTimeEndLastYear = getDaylightSavingEndTime(currentDate.getFullYear());

	// Check if the date is between DST of the current year/next year or DST of last year/current year
	// I.e Checks between November - March of this year/next year || November - March of last year/this year
	// Comment this out if working locally
	if(Date.parse(currentDate.toLocaleDateString()) >= Date.parse(daylightSavingTimeStart) && Date.parse(currentDate.toLocaleDateString()) <= Date.parse(daylightSavingTimeEnd) ||
			(Date.parse(currentDate.toLocaleDateString()) >= Date.parse(daylightSavingTimeStartLastYear) && Date.parse(currentDate.toLocaleDateString()) <= Date.parse(daylightSavingTimeEndLastYear))) {
		// If true, Server time is only 5 hours ahead
		// Set hours back 5
		currentDate.setHours(currentDate.getHours() - 5);
	} else {
		// Else Set hours back 4 -- Server's time 4 hours ahead of local time
		currentDate.setHours(currentDate.getHours() - 4);
	}

	currentDate.setSeconds(0, 0);

	const currentMonthDay = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
	const currentYear = currentDate.getFullYear();

	// For every birthday object get the date in mm/dd format and year
	doc.forEach((birthday) => {
		const birthdayDate = `${birthday.birthday.getMonth() + 1}/${birthday.birthday.getDate()}`;
		const birthdayYear = birthday.birthday.getFullYear();

		// If the birthday month and date are the same as the current month and day
		// Send a message to the general channel
		if (birthdayDate === currentMonthDay) {
			genChannel.send(`@everyone, ${birthday.firstName} turns ${currentYear - birthdayYear} today!`);
			console.log('There is a birthday today');
		}
	});

}

async function scheduleChecker(remindersChannel) {
	// Create a query getting all documents from Event collection sorting by id
	// Await query to get array of document objects
	const query = Event.find().sort({ eventId: 1 });
	const doc = await query;

	// Get todays date
	// Set the seconds/milliseconds to 0
	const today = new Date();

	// Get dates for Daylight Saving Times (DST)
	const daylightSavingTimeStart = getDaylightSavingStartTime(today.getFullYear());
	const daylightSavingTimeEnd = getDaylightSavingEndTime(today.getFullYear() + 1);

	// Gets dates for Daylight Saving Times for Last Year
	const daylightSavingTimeStartLastYear = getDaylightSavingStartTime(today.getFullYear() - 1);
	const daylightSavingTimeEndLastYear = getDaylightSavingEndTime(today.getFullYear());

	// Check if the date is between DST of the current year/next year or DST of last year/current year
	// I.e Checks between November - March of this year/next year || November - March of last year/this year
	// Comment this out if working locally
	if(Date.parse(today.toLocaleDateString()) >= Date.parse(daylightSavingTimeStart) && Date.parse(today.toLocaleDateString()) <= Date.parse(daylightSavingTimeEnd) ||
			(Date.parse(today.toLocaleDateString()) >= Date.parse(daylightSavingTimeStartLastYear) && Date.parse(today.toLocaleDateString()) <= Date.parse(daylightSavingTimeEndLastYear))) {
		// If true, Server time is only 5 hours ahead
		// Set hours back 5
		today.setHours(today.getHours() - 5);
	} else {
		// Else Set hours back 4 -- Server's time 4 hours ahead of local time
		today.setHours(today.getHours() - 4);
	}

	today.setSeconds(0, 0);

	// Get tomorrows date (todays date + 1)
	// Set the seconds/milliseconds to 0
	const tomorrow = new Date();
	tomorrow.setDate(today.getDate() + 1);
	// Sets hours back 4 -- Server's time 4 hours ahead of local time
	// Comment this line out if working locally
	tomorrow.setHours(today.getHours());
	tomorrow.setSeconds(0, 0);

	// Get date for an hour ahead (todays hour + 1)
	// Set the seconds/milliseconds to 0
	const hourAhead = new Date();
	hourAhead.setHours(today.getHours() + 1);
	hourAhead.setSeconds(0, 0);

	// Loop through each event
	doc.forEach(async event => {
		// Get all the fields
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

		// Check the reminder type
		if(reminderType === 'day') {
			// If reminder type is a day and tomorrows time equals the event time
			if(tomorrow.toLocaleString() === eventDate.toLocaleString()) {
				console.log('Event DB Called');
				// Send message to channel reminding participants of event in 24 hours
				return remindersChannel.send(`:alarm_clock: ${eventPeople} --- ${eventName} is in 24 hours! :alarm_clock:`);
			}
		} else if(reminderType === 'hour') {
			// If reminder type is an hour and hourAhead time equals the event time
			if(hourAhead.toLocaleString() === eventDate.toLocaleString()) {
				console.log('Event DB Called');
				// Send message to channel reminding participants of event in 1 hour
				return remindersChannel.send(`:alarm_clock: ${eventPeople} --- ${eventName} is in 1 hour! :alarm_clock:`);
			}
		} else if(reminderType === 'both') {
			// If reminder type is a day and tomorrows time equals the event time
			if(tomorrow.toLocaleString() === eventDate.toLocaleString()) {
				console.log('Event DB Called');
				// Send message to channel reminding participants of event in 24 hours
				return remindersChannel.send(`:alarm_clock: ${eventPeople} --- ${eventName} is in 24 hours! :alarm_clock:`);
			// Send message to channel reminding participants of event in 24 hours
			} else if(hourAhead.toLocaleString() === eventDate.toLocaleString()) {
				console.log('Event DB Called');
				// Send message to channel reminding participants of event in 1 hour
				return remindersChannel.send(`:alarm_clock: ${eventPeople} --- ${eventName} is in 1 hour! :alarm_clock:`);
			}
		}
		// If current time equals event time
		if(today.toLocaleString() === eventDate.toLocaleString()) {
			// Delete event from database
			await Event.findOneAndDelete({ eventId: event.eventId });
			console.log('Event DB Called');
			// Send message to channel letting participants of event
			return remindersChannel.send(`:alarm_clock: ${eventPeople} --- ${eventName} starts now! :alarm_clock:`);
		}
	});
}

async function streamChecker(livePromotionChannel) {
	// Create a query getting all documents from Event collection sorting by id
	// Await query to get array of document objects
	const query = Streamer.find().sort({ id: 1 });
	const doc = await query;

	// If no streamers in DB, doc returns empty array, exit method
	if(doc.length < 1) return;

	let streamUrl = `${process.env.TWITCH_STREAM_API}`;
	doc.forEach(streamer => {
		streamUrl = streamUrl + `user_login=${streamer.streamerName}&`;
	});

	const searchResult = (await axios({
		url: streamUrl,
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Client-ID': process.env.TWITCH_CLIENT_ID,
			'Authorization': `Bearer ${process.env.TWITCH_TOKEN}`,
		},
	})).data.data;

	// For every streamer in DB
	doc.forEach(async streamer => {
		// Find and return the index of searchResult where the current live streamer equals the streamer in DB
		let i;
		searchResult.find((liveStreamer, index) => {
			if(streamer.streamerName === liveStreamer.user_name) {
				i = index;
				return true;
			}
		});

		// i = Undefined if streamer in DB is not found in searchResult
		// i = n if streamer is in searchResult (ie Is currently live)
		if(i !== undefined) {
			// Call API to get the game name they are playing (or just chatting)
			const gameName = (await axios({
				url: `${process.env.TWITCH_GAME_API}id=${searchResult[i].game_id}`,
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Client-ID': process.env.TWITCH_CLIENT_ID,
					'Authorization': `Bearer ${process.env.TWITCH_TOKEN}`,
				},
			})).data.data;

			// If the game title in DB is different from the game title API gives (i.e they are playing a different game)
			if (streamer.gameTitle !== gameName[0].name) {
				// Create Embed to send to channel
				// SetURL makes the title a hyperlink
				const embed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTimestamp()
					.setTitle(`${streamer.streamerName} is live on Twitch!`)
					.setURL(`https://twitch.tv/${streamer.streamerName}`)
					.setDescription(gameName[0].name);
				// Log
				console.log(`${streamer.streamerName} went live`);

				// Send embed to channel
				livePromotionChannel.send(embed);

				// Update the streamer (document) to 'Live' status and current Game
				streamer.status = 'Live';
				streamer.gameTitle = gameName[0].name;
				await streamer.save();
			}
		// Else the streamer is not live
		} else {
			// If the status in DB says they are live
			// eslint-disable-next-line no-lonely-if
			if(streamer.status === 'Live') {
				// Change status and title for that streamer (document) and save to DB
				streamer.status = 'Offline';
				streamer.gameTitle = '';
				await streamer.save();

				// Log
				console.log(`${streamer.streamerName} went offline`);
			}
		}
	});
}

// ---------------------------- Helper Functions ------------------------------

// Returns the Start date for DST
// First Sunday of November
function getDaylightSavingStartTime(year) {
	const date = new Date(year, 10, 7);
	date.setDate(7 - date.getDay());
	return date;
}

// Returns the End date for DST
// Second Sunday of March
function getDaylightSavingEndTime(year) {
	const date = new Date(year, 2, 7);
	date.setDate(7 + (7 - date.getDay()));
	return date;
}