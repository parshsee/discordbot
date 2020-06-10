require('dotenv').config();
const axios = require('axios');

async function apiCalls() {
	// Make API call to get image of the random animal
	// .data to only return the data (response)
	const memeLink = (await axios({
		url: process.env.MEME_API,
		method: 'GET',
		headers: {
			'Accept': 'application/json',
		},
	})).data;

	return memeLink;
}

module.exports = {
	name: 'meme',
	aliases: [],
	description: 'Sends a random meme!',
	args: false,
	usage: '',
	async execute(message, args) {

		if(message.channel.name !== 'memes') return message.channel.send('This command can only be used in memes channel');

		const response = await apiCalls();

		return message.channel.send((response.nsfw || response.spoiler) ? `__**NSFW or SPOILER**__ \n${response.title}` : `${response.title}`, {
			files: [{
				attachment: `${response.url}`,
				name: (response.nsfw || response.spoiler) ? 'SPOILER_IMG.jpg' : 'REG_IMG.jpg',
			}],
		});
	},
};