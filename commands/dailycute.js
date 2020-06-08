require('dotenv').config();
const axios = require('axios');

module.exports = {
	name: 'dailycute',
	aliases: ['cute', 'animal'],
	description: 'Sends a random cute animal image',
	args: false,
	usage: '',
	// eslint-disable-next-line no-unused-vars
	async execute(message, args) {
		// Using this API: https://some-random-api.ml/

		const randomNum = Math.floor(Math.random() * 7);
		const animalsArr = ['dog', 'cat', 'panda', 'red_panda', 'birb', 'fox', 'koala'];

		const animal = animalsArr[randomNum];
		let aFact = '';

		if(animal === 'red_panda') {
			aFact = animalsArr[2];
		} else if(animal === 'birb') {
			aFact = 'bird';
		} else {
			aFact = animal;
		}

		const animalImage = (await axios({
			url: process.env.ANIMAL_IMAGE_API + animal,
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
		})).data;

		const animalFact = (await axios({
			url: process.env.ANIMAL_FACT_API + aFact,
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
		})).data;

		message.channel.send(`${animalFact.fact}`, { files: [`${animalImage.link}`] });
	},
};