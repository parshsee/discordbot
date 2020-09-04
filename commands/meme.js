require('dotenv').config();
const axios = require('axios');

let memeCreationInfo = {};

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

async function memeCreation(message, args) {
	// Create a filter where the responses author has to be the same as the once who started the command
	const filter = m => m.author.id === message.author.id;

	try {
		await questionImage(message, filter);
		//await questionTop(message, filter);
		//await questionBottom(message, filter);
	} catch (error) {
		console.log(error.message);
	}
}

async function questionImage(message, filter) {
	message.channel.send('Upload the image template');

	// Create await message, waiting 2 minutes for 1 message from the author
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });

	if(msg.first().attachments.first()) {
		console.log(msg.first().attachments.first().attachment);
		memeCreationInfo.url = msg.first().attachments.first().attachment;
	} else {
		throw new UserException('No attachment found', 1);
	}
}

async function questionTop(message, filter) {
	message.channel.send('What is the top text?');

	// Create await message, waiting 2 minutes for 1 message from the author
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });

}

async function questionBottom(message, filter) {
	message.channel.send('What is the bottom text?');

	// Create await message, waiting 2 minutes for 1 message from the author
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });


}

// Exception function takes message and position
// Message = Error message to display
// Position = Which question it happened in
function UserException(errMsg, position) {
	this.message = errMsg;
	this.position = position;
	this.name = 'UserException';
}

module.exports = {
	name: 'meme',
	aliases: ['memes'],
	description: 'Sends a meme from a random subreddit (dankmemes, memes, me_irl) or a specified one!',
	args: false,
	usage: ' **OR** \nia!meme [subreddit name]',
	async execute(message, args) {
		if(args.length === 1 && args[0].toLowerCase() === 'create') {
			await memeCreation(message, args);
		}

		// If channel isn't memes channel return error message
		// Remove to allow memes in any channel
		if(message.channel.name !== 'memes') return message.channel.send('This command can only be used in memes channel');

		if((args.length && args[0].toLowerCase() !== 'create') || !args.length) {
			// Get the subreddit name from the args
			// Get response from meme api call
			const subreddit = args.join(' ');
			const response = await apiCalls(subreddit);

			// If given a response code (error) return error message
			if (response.code) return message.channel.send('This subreddit does not exist, is typed incorrectly, or has no images.');

			// Send the image from the response with ternary checks to see if its NSFW or Spoiler and blurring image if true
			return message.channel.send((response.nsfw || response.spoiler) ? `__**NSFW or SPOILER**__ \n${response.title}` : `${response.title}`, {
				files: [{
					attachment: `${response.url}`,
					name: (response.nsfw || response.spoiler) ? 'SPOILER_IMG.jpg' : 'REG_IMG.jpg',
				}],
			});
		}
	},
};