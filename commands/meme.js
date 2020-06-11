require('dotenv').config();
const axios = require('axios');

async function apiCalls(subreddit = '') {
	// Make API call to get random meme from reddit
	// .data to only return the data (response)
	try {
		const memeLink = (await axios({
			url: process.env.MEME_API + `/${subreddit}`,
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
		}));

		return memeLink.data;
	} catch (error) {
		console.log(error.response);
		return error.response.data;
	}

}

module.exports = {
	name: 'meme',
	aliases: [],
	description: 'Sends a meme from a random subreddit (dankmemes, memes, me_irl) or a specified one!',
	args: false,
	usage: ' **OR** \nia!meme [subreddit name]',
	async execute(message, args) {

		if(message.channel.name !== 'memes') return message.channel.send('This command can only be used in memes channel');

		const subreddit = args.join(' ');
		const response = await apiCalls(subreddit);

		if(response.code) return message.channel.send('This subreddit does not exist, is typed incorrectly, or has no images.');

		return message.channel.send((response.nsfw || response.spoiler) ? `__**NSFW or SPOILER**__ \n${response.title}` : `${response.title}`, {
			files: [{
				attachment: `${response.url}`,
				name: (response.nsfw || response.spoiler) ? 'SPOILER_IMG.jpg' : 'REG_IMG.jpg',
			}],
		});
	},
};