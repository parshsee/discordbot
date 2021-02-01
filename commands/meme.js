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

async function memeCreation(message) {
	// Create a filter where the responses author has to be the same as the once who started the command
	const filter = m => m.author.id === message.author.id;

	// Go through each question, catch an error (thrown or timeout)
	try {
		await questionImage(message, filter);
		await questionTop(message, filter);
		await questionBottom(message, filter);
	} catch (error) {
		// If error is UserException, ask them to retry
		if (error instanceof UserException) {
			await retryCommand(message, error.message, error.position);
		// Else it's timeout error, can't ask to retry here
		} else {
			console.log('Call to Meme Creator API: Failure');
			console.log(error);
			message.channel.send('No response given. Command timed out.');
			// Since global variable, reset it at the end
			memeCreationInfo = {};
		}
	}

	// If not keys in memeCreationInfo object, exit command
	if(!Object.keys(memeCreationInfo).length) return;

	console.log('Call to Meme Creator API: Successful');
	// Return the formatted url (API is stateless, this is how the call is done)
	return `https://api.memegen.link/images/custom/${memeCreationInfo.topText}/${memeCreationInfo.bottomText}.png?background=${memeCreationInfo.url}`;

}

async function questionImage(message, filter) {
	// Send message asking for image template
	message.channel.send('Upload the image template');

	// Create await message, waiting 2 minutes for 1 message from the author
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });

	// Check the msg collection to see if there is an attachment in the attachment collection
	if(msg.first().attachments.first()) {
		// Set the url in object to the attachment url
		memeCreationInfo.url = msg.first().attachments.first().attachment;
	} else {
		// Throw exception if not found
		throw new UserException('No attachment found', 1);
	}
}

async function questionTop(message, filter) {
	// Send message asking for top text, options to have none or to cancel
	message.channel.send('What is the top text? For no top text type \'N/A\'. To cancel type \'C\'');

	// Create await message, waiting 2 minutes for 1 message from the author
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });

	// Check if the message is n/a, so the user wants it blank
	if(msg.first().content.toLowerCase() === 'n/a') {
		// Set top text to be blank
		memeCreationInfo.topText = '_';
	// Check if the message is c, so the user wants to cancel
	} else if(msg.first().content.toLowerCase() === 'c') {
		// Throw exception saying command cancelled
		throw new UserException('Command cancelled', 1);
	// Else what remains would be the top text
	} else {
		// Filter the text so the API reads it properly
		const filteredText = filterText(msg.first().content);
		// Set top text to the filteredText
		memeCreationInfo.topText = filteredText;
	}
}

async function questionBottom(message, filter) {
	// Send message asking for top text, options to have none or to cancel
	message.channel.send('What is the bottom text? For no bottom text type \'N/A\'. To cancel type \'C\'');

	// Create await message, waiting 2 minutes for 1 message from the author
	const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });

	// Check if the message is n/a, so the user wants it blank
	if(msg.first().content.toLowerCase() === 'n/a') {
		// Set bottom text to be blank
		memeCreationInfo.bottomText = '_';
	// Check if the message is c, so the user wants to cancel
	} else if(msg.first().content.toLowerCase() === 'c') {
		// Throw exception saying command cancelled
		throw new UserException('Command cancelled', 1);
	// Else what remains would be the top text
	} else {
		// Filter the text so the API reads it properly
		const filteredText = filterText(msg.first().content);
		// Set top text to the filteredText
		memeCreationInfo.bottomText = filteredText;
	}
}

function filterText(text) {
	// Given a text, split it into an array using the seperator
	// Then join it back into a string with the join item inbetween each element
	// This is a crude way to replacAll(thing to replace, thing to replace with)
	let filteredText = text.split('_').join('__');
	filteredText = filteredText.split(' ').join('_');
	filteredText = filteredText.split('?').join('~q');
	filteredText = filteredText.split('%').join('~p');
	filteredText = filteredText.split('#').join('~h');
	filteredText = filteredText.split('/').join('~s');
	filteredText = filteredText.split('"').join('\'\'');
	filteredText = filteredText.split('-').join('--');

	return filteredText;
}

// Function to let user retry if there was a validation error
async function retryCommand(message, errMsg, position) {
	// Create a filter where the responses author has to be the same as the once who started the command
	const filter = m => m.author.id === message.author.id;

	try {
		// Send the error message along with asking them to retry
		message.channel.send(errMsg + ' __Retry? (Y/N)__');
		// Create await message, waiting 2 minutes for 1 message from the author
		const msg2 = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });

		// This was the best way I found to do it :(
		// If they want to retry use position to put in correct question
		if (msg2.first().content.toLowerCase() === 'y') {
			if(position === 1) {
				await questionImage(message, filter);
				await questionTop(message, filter);
				await questionBottom(message, filter);
			}
		// If they don't want to continue, cancel command & clear/reset memeCreationInfo
		} else if (msg2.first().content.toLowerCase() === 'n') {
			message.channel.send('Command cancelled.');
			memeCreationInfo = {};
		// If they give any other response, cancel command & clear/reset memeCreationInfo
		// Can't ask them to retry here
		} else {
			message.channel.send('Incorrect Response. Command Cancelled');
			memeCreationInfo = {};
		}
	} catch (err) {
		// If error is UserException go back to retry message
		if (err instanceof UserException) {
			await retryCommand(message, err.message, err.position);
		// If timeout after retry is called, the else gets called. No way to ask them to retry here.
		} else {
			message.channel.send('No response given. Command timed out.');
			memeCreationInfo = {};
		}
	}
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
	description: 'Sends a meme from a random subreddit (dankmemes, memes, me_irl) or a specified one! \n You can also now create your memes using ia!meme create',
	args: false,
	usage: ' --- Sends a meme from a random subreddit (dankmemes, memes, me_irl)' +
				'\n**•**ia!meme [subreddit name] --- Sends a random meme from a specific subreddit' +
				'\n**•**ia!meme create --- Starts the process of creating your own meme',
	async execute(message, args) {
		// If only 1 args that is 'create'
		if(args.length === 1 && args[0].toLowerCase() === 'create') {
			// Call memeCreation function, which would return a url (blank if error/cancel)
			const url = await memeCreation(message);
			// If the url is undefined, end command
			if(!url) return;

			// Send message 'Creating', call with url takes a bit (1-2 seconds) to send
			message.channel.send('Creating...');
			// Send message with title and file, the url created
			return message.channel.send('Here\'s your meme!', {
				files: [{
					attachment: url,
					name: 'REG_IMG.jpg',
				}],
			});
		}

		// If channel isn't memes channel return error message
		// Remove to allow memes in any channel
		if(message.channel.name !== 'memes') return message.channel.send('This command can only be used in memes channel');

		// Check if there are arguments and the first arg isn't 'create' || There are no arguments
		// Both indicators that user wants to use Reddit Meme API
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