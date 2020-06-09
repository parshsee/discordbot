require('dotenv').config();
const axios = require('axios');

module.exports = {
	name: 'meme',
	aliases: [],
	description: 'Sends a random meme!',
	args: false,
	usage: '',
	async execute(message, args) {
		console.log(message, args);

	},
};