require('dotenv').config();
const axios = require('axios');

// Function to make call to meme API
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

		console.log('Call to Meme API: Successful');
		return memeLink.data;
	} catch (error) {
		console.log('Call to Meme API: Failure');
		// Log the API error and return the data
		console.log(error.response);
		return error.response.data;
	}

}

module.exports = {
	name: 'meme',
	aliases: ['memes'],
	description: 'Sends a meme from a random subreddit (dankmemes, memes, me_irl) or a specified one!',
	args: false,
	usage: ' **OR** \nia!meme [subreddit name]',
	async execute(message, args) {

		// If channel isn't memes channel return error message
		// Remove to allow memes in any channel
		if(message.channel.name !== 'memes') return message.channel.send('This command can only be used in memes channel');

		// Get the subreddit name from the args
		// Get response from meme api call
		const subreddit = args.join(' ');
		const response = await apiCalls(subreddit);

		// If given a response code (error) return error message
		if(response.code) return message.channel.send('This subreddit does not exist, is typed incorrectly, or has no images.');

		// Send the image from the response with ternary checks to see if its NSFW or Spoiler and blurring image if true
		return message.channel.send((response.nsfw || response.spoiler) ? `__**NSFW or SPOILER**__ \n${response.title}` : `${response.title}`, {
			files: [{
				attachment: `${response.url}`,
				name: (response.nsfw || response.spoiler) ? 'SPOILER_IMG.jpg' : 'REG_IMG.jpg',
			}],
		});
	},
};