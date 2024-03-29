require('dotenv').config();
const axios = require('axios');
const { MessageAttachment } = require('discord.js');

async function apiCalls(animal, aFact) {

	try {
		// Make API call to get image of the random animal
		// .data to only return the data (response)
		const animalImage = (await axios({
			url: process.env.ANIMAL_IMAGE_API + animal,
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
		})).data;

		// Make API call to get fact of the random animal
		// .data to only return the data (response)
		const animalFact = (await axios({
			url: process.env.ANIMAL_FACT_API + aFact,
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
		})).data;

		// Construct an object response
		const response = {
			fact: animalFact.fact,
			link: animalImage.link,
		};

		console.log('Call to Some-Random-API: Successful');
		return response;
	} catch (error) {
		console.log('Call to Some-Random-API: Failure', error);
		const response = {
			error: true,
			errorMessage: 'Command Failed: Error connecting to Databasee',
		};

		return response;
	}
}

module.exports = {
	name: 'dailycute',
	aliases: ['cute', 'animal'],
	description: 'Sends a random cute animal image',
	args: false,
	usage: ' --- Gets a random cute animal image',
	async execute(message, args) {
		// Using this API: https://some-random-api.ml/

		// Generates a random number from 0 to 6
		const randomNum = Math.floor(Math.random() * 7);
		// Array of all animal endpoints
		const animalsArr = ['dog', 'cat', 'panda', 'red_panda', 'birb', 'fox', 'koala'];

		// If given an argument, return error message
		if (args.length) return message.channel.send('This command doesn\'t take any arguments!');

		// Get random animal and initalize animal fact
		const animal = animalsArr[randomNum];
		let aFact = '';

		// Animal fact API has different names for bird and red panda
		if (animal === 'red_panda') {
			aFact = animalsArr[2];
		} else if (animal === 'birb') {
			aFact = 'bird';
		} else {
			aFact = animal;
		}

		// Make API calls with random animals
		const response = await apiCalls(animal, aFact);

		// Check if there was an error during API call
		if (response.error) return message.channel.send(response.errorMessage);

		// Return fact and animal image
		// Send image as new message attachment, with link and file name
		// Before, discord js treated the file as the name, if it didn't have image extension it sent it as a file
		return message.channel.send(`${response.fact}`, { files: [new MessageAttachment(response.link, 'animal.png')] });
	},
};