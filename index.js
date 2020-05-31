// Require dotenv and get the config variables, defined in our .env
require('dotenv').config();
// Require Node native filesystem module
const fs = require('fs');
// Require the Discord.js module
const Discord = require('discord.js');
// Require the database connection to MongoDB
const database = require('./database/database.js');

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
	client.user.setActivity('you | ia!commands', { type: 'WATCHING' });
	console.log('Ready!');

	// Make the connection to MongoDB
	// Async/Await instead of Then/Catch
	// https://stackoverflow.com/questions/54890608/how-to-use-async-await-with-mongoose/54892088
	(async () => {
		try {
			await database;
			console.log('Connected to MongoDB!');
		} catch (err) {
			console.log('error: ' + err);
		}
	})();

});


client.on('message', message => {
	// If the message doesn't start with the prefix || This bot sent the message, exit
	if(!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;

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


// Login in server with app token should be last line of code
client.login(process.env.TOKEN);