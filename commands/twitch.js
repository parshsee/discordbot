require('dotenv').config();
const axios = require('axios');


async function addStreamer(message, args) {

}

async function removeStreamer(message, args) {

}

async function listStreamer(message, args) {

}

module.exports = {
	name: 'twitch',
	aliases: [],
	description: 'Adds or removes a Twitch streamer from the database or shows all streamers',
	args: true,
	usage: '\n[add] [Twitch Username] **OR** \n[remove] [ID] **OR** \n[list]',
	async execute(message, args) {
		if(message.channel.type === 'dm') return message.channel.send('This command can\'t be used as a DM');

		// Get the first argument and remove it from array
		const firstArg = args.shift().toLowerCase();

		if(firstArg === 'add') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (add + 1 args)
			if (args.length !== 1) {
				return message.channel.send('Command needs two (2) arguments, run \'ia!help twitch\' for more info');
			}
			// Call addStreamer function to confirm and add to database
			await addStreamer(message, args);
		} else if (firstArg === 'remove') {
			// Shift removes the first arg from array
			// Message sends total number of args needed (remove + 1 args)
			if (args.length !== 1) {
				return message.channel.send('Command needs two (2) arguments, run \'ia!help twitch\' for more info');
			}
			// Call removeStreamer function to remove from database
			await removeStreamer(message, args);
		} else if(firstArg === 'list') {
			// ID	|	Twitch Streamer Name   |   Twitch URL
			await listStreamer(message, args);
		}
	},
};