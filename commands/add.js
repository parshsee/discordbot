require('dotenv').config();
// Get the Games schema
const Game = require('../database/models/games');

const steamErrorMessage = 'Steam key not recognized. Make sure it is in the correct format (ex. XXXXX-XXXXX-XXXXX)';
const microsoftErrorMessage = 'Microsoft key not recognized. Make sure it is in the correct format (ex. XXXXX-XXXXX-XXXXX-XXXXX-XXXXX)';
const gogErrorMessage = 'GOG key not recognized. Make sure it is in the correct format (ex. XXXXX-XXXXX-XXXXX-XXXXX or XXXXXXXXXXXXXXXXXX)';
const originErrorMessage = 'Origin key not recognized. Make sure it is in the correct format (ex. XXXX-XXXX-XXXX-XXXX)';
const epicErrorMessage = 'Epic key not recognized. Make sure it is in the correct format (ex. XXXXX-XXXXX-XXXXX-XXXXX)';
const uplayErrorMessage = 'Uplay key not recognized. Make sure it is in the correct format (ex. XXX-XXXX-XXXX-XXXX-XXXX or XXXX-XXXX-XXXX-XXXX)';

async function codeTypeChoice(message) {
	const codeTypes = ['Steam', 'Microsoft', 'GOG', 'Origin', 'Epic', 'Uplay'];
	const filter = m => m.author.id === message.author.id;

	try {
		message.channel.send('What is the game code? (Steam, Microsoft, GOG, Origin, Epic, or Uplay) \nType \'C\' to cancel ');
		const msg = await message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] });
		const response = msg.first().content.toLowerCase();

		if(codeTypes.map(type => { return type.toLowerCase();}).includes(response)) {
			return response;
		} else if(response === 'c') {
			message.channel.send('Command Cancelled');
			return null;
		} else {
			message.channel.send('Invalid response, please choose one of the options or cancel');
			await codeTypeChoice(message);
		}

	} catch (error) {
		message.channel.send('No response given. Command timed out.');
		return null;
	}
}

function argsValidation(args, codeType) {
	const errors = {
		found: false,
	};

	// Sets the gameType, gameKey (array split by '-'), and gameName
	// Example Key: LLJNN-IF2XT-6NGVY
	// Should follow specified format
	// Game Name, Key, Type
	const gameType = args[args.length - 1];
	const gameName = args.slice(0, args.length - 2).join(' ');

	gameTypeValidation(gameType, errors);
	switch(codeType) {
	case 'steam':
		validateSteamKey(args, errors);
		break;
	case 'microsoft':
		validateMicrosoftKey(args, errors);
		break;
	case 'gog':
		validateGOGKey(args, errors);
		break;
	case 'origin':
		validateOriginKey(args, errors);
		break;
	case 'epic':
		validateEpicKey(args, errors);
		break;
	case 'uplay':
		validateUplayKey(args, errors);
		break;
	}


	console.log(errors);

	// If no errors found
	// Set name = gameName
	// Set key = Full Steam Key (not split)
	// Set type = gameType
	errors.name = gameName;
	errors.key = args[args.length - 2];
	errors.type = gameType;
	errors.codeType = codeType !== 'gog' ? codeType.charAt(0).toUpperCase() + codeType.slice(1) : codeType.toUpperCase();
	return errors;
}

function gameTypeValidation(gameType, errors) {
	// If game type isn't game, dlc, or other
	// Return error w/ message
	if(!(gameType.toLowerCase() === 'game' || gameType.toLowerCase() === 'dlc' || gameType.toLowerCase() === 'other')) {
		errors.found = true;
		errors.message = 'Type can only be \'Game\', \'DLC\', or \'Other\'';
	}

	return errors;
}

function validateSteamKey(args, errors) {
	const gameKey = args[args.length - 2].split('-');

	console.log(gameKey);
	// If the Key array is less than 3 or greater than 3 (Steam Key should only have 3 after splitting by '-')
	// Return error w/ message
	if(gameKey.length < 3 || gameKey.length > 3) {
		errors.found = true;
		errors.message = steamErrorMessage;
	} else {
		// For every section of the key
		// Check that it's 5 letters long
		// --------Check that ALL the letters aren't numbers------ Small Possibility random steam code has all nunmbers
		// Check that all the letters are uppercase (numbers automatically come back as true, possible error)
		for(const keyPart of gameKey) {
			if(keyPart.length < 5 || keyPart.length > 5) {
				errors.found = true;
				errors.message = steamErrorMessage;
			}
			// if(!isNaN(keyPart)) {
			//     errors.found = true;
			//     errors.message = 'Steam key not recognized. Make sure it is in the correct format';
			// }
			if(!(keyPart === keyPart.toUpperCase())) {
				errors.found = true;
				errors.message = steamErrorMessage;
			}
		}
	}

	return errors;
}

function validateMicrosoftKey(args, errors) {
	const gameKey = args[args.length - 2].split('-');

	// If the Key array is doesn't equal 5 (Microsoft Key should only have 5 after splitting by '-')
	// Return error w/ message
	if(gameKey.length !== 5) {
		errors.found = true;
		errors.message = microsoftErrorMessage;
	} else {
		// For every section of the key
		// Check that it's 5 letters long
		// --------Check that ALL the letters aren't numbers------ Small Possibility random Microsoft code has all nunmbers
		// Check that all the letters are uppercase (numbers automatically come back as true, possible error)
		for(const keyPart of gameKey) {
			if(keyPart.length !== 5) {
				errors.found = true;
				errors.message = microsoftErrorMessage;
			}
			// if(!isNaN(keyPart)) {
			//     errors.found = true;
			//     errors.message = 'Microsoft key not recognized. Make sure it is in the correct format';
			// }
			if(!(keyPart === keyPart.toUpperCase())) {
				errors.found = true;
				errors.message = microsoftErrorMessage;
			}
		}
	}

	return errors;
}

function validateGOGKey(args, errors) {
	const gameKey = args[args.length - 2].split('-');

	// If the array is only 1 long & the first element isn't 18 characters (Discount Codes have 18 characters all together)
	// Return error w/ message
	if(gameKey.length === 1 && gameKey[0].length !== 18) {
		errors.found = true;
		errors.message = gogErrorMessage;
	// Else If the Key array is doesn't equal 4 (GOG Key should only have 4 after splitting by '-') & the first isnt 18 long (Discount Codes)
	// Return error w/ message
	} else if(gameKey.length !== 4 && gameKey[0].length !== 18) {
		errors.found = true;
		errors.message = gogErrorMessage;
	} else if(gameKey.length === 4 && gameKey[0].length !== 18) {
		// For every section of the key
		// Check that it's 5 letters long
		// --------Check that ALL the letters aren't numbers------ Small Possibility random GOG code has all nunmbers
		// Check that all the letters are uppercase (numbers automatically come back as true, possible error)
		for(const keyPart of gameKey) {
			if(keyPart.length !== 5) {
				errors.found = true;
				errors.message = gogErrorMessage;
			}
			// if(!isNaN(keyPart)) {
			//     errors.found = true;
			//     errors.message = 'GOG key not recognized. Make sure it is in the correct format';
			// }
			if(!(keyPart === keyPart.toUpperCase())) {
				errors.found = true;
				errors.message = gogErrorMessage;
			}
		}
	}

	return errors;

}

function validateOriginKey(args, errors) {
	const gameKey = args[args.length - 2].split('-');

	// If the Key array is doesn't equal 4 (Origin Key should only have 4 after splitting by '-')
	// Return error w/ message
	if(gameKey.length !== 4) {
		errors.found = true;
		errors.message = originErrorMessage;
	} else {
		// For every section of the key
		// Check that it's 4 letters long
		// --------Check that ALL the letters aren't numbers------ Small Possibility random Origin code has all nunmbers
		// Check that all the letters are uppercase (numbers automatically come back as true, possible error)
		for(const keyPart of gameKey) {
			if(keyPart.length !== 4) {
				errors.found = true;
				errors.message = originErrorMessage;
			}
			// if(!isNaN(keyPart)) {
			//     errors.found = true;
			//     errors.message = 'Microsoft key not recognized. Make sure it is in the correct format';
			// }
			if(!(keyPart === keyPart.toUpperCase())) {
				errors.found = true;
				errors.message = originErrorMessage;
			}
		}
	}

	return errors;
}

function validateEpicKey(args, errors) {
	const gameKey = args[args.length - 2].split('-');

	// If the Key array is doesn't equal 4 (Epic Key should only have 4 after splitting by '-')
	// Return error w/ message
	if(gameKey.length !== 4) {
		errors.found = true;
		errors.message = epicErrorMessage;
	} else {
		// For every section of the key
		// Check that it's 5 letters long
		// --------Check that ALL the letters aren't numbers------ Small Possibility random Epic code has all nunmbers
		// Check that all the letters are uppercase (numbers automatically come back as true, possible error)
		for(const keyPart of gameKey) {
			if(keyPart.length !== 5) {
				errors.found = true;
				errors.message = epicErrorMessage;
			}
			// if(!isNaN(keyPart)) {
			//     errors.found = true;
			//     errors.message = 'Epic key not recognized. Make sure it is in the correct format';
			// }
			if(!(keyPart === keyPart.toUpperCase())) {
				errors.found = true;
				errors.message = epicErrorMessage;
			}
		}
	}

	return errors;
}

function validateUplayKey(args, errors) {
	const gameKey = args[args.length - 2].split('-');

	if (gameKey[0].length === 4) {
		// If the Key array is doesn't equal 4 (Uplay Key should only have 4 after splitting by '-')
		// Return error w/ message
		if (gameKey.length !== 4) {
			errors.found = true;
			errors.message = uplayErrorMessage;
		} else {
			// For every section of the key
			// Check that it's 5 letters long
			// --------Check that ALL the letters aren't numbers------ Small Possibility random Uplay code has all nunmbers
			// Check that all the letters are uppercase (numbers automatically come back as true, possible error)
			for (const keyPart of gameKey) {
				if (keyPart.length !== 4) {
					errors.found = true;
					errors.message = uplayErrorMessage;
				}
				// if(!isNaN(keyPart)) {
				//     errors.found = true;
				//     errors.message = 'Epic key not recognized. Make sure it is in the correct format';
				// }
				if (!(keyPart === keyPart.toUpperCase())) {
					errors.found = true;
					errors.message = uplayErrorMessage;
				}
			}
		}
	} else if(gameKey[0].length === 3) {
		// If the Key array is doesn't equal 5 (Alternate Uplay Key should only have 5 after splitting by '-')
		// Return error w/ message
		if (gameKey.length !== 5) {
			errors.found = true;
			errors.message = uplayErrorMessage;
		} else {
			// Remove the first element because it has 3 characters
			gameKey.shift();
			// For every section of the key
			// Check that it's 5 letters long
			// --------Check that ALL the letters aren't numbers------ Small Possibility random Uplay code has all nunmbers
			// Check that all the letters are uppercase (numbers automatically come back as true, possible error)
			for (const keyPart of gameKey) {
				if (keyPart.length !== 4) {
					errors.found = true;
					errors.message = uplayErrorMessage;
				}
				// if(!isNaN(keyPart)) {
				//     errors.found = true;
				//     errors.message = 'Epic key not recognized. Make sure it is in the correct format';
				// }
				if (!(keyPart === keyPart.toUpperCase())) {
					errors.found = true;
					errors.message = uplayErrorMessage;
				}
			}
		}
	}else {
		errors.found = true;
		errors.message = uplayErrorMessage;
	}

	return errors;

}

module.exports = {
	name: 'add',
	aliases: [],
	description: 'Adds the specified game and key to the database! \n__*This command can only be used as a DM to the bot*__',
	args: true,
	usage: '[game name] [key] [type: Game, DLC, Other]',
	async execute(message, args) {
		// Create a reply with sentence + their message
		const reply = `This command can only be used as a DM: \n${message.content}`;

		// If the message was sent in dm channel
		if(message.channel.type === 'dm') {
			// Check if there are at 3 argleast uments
			// Game Name (Can be multiple arguments), Key, Type
			if (args.length < 3) {
				return message.channel.send('Command needs three (3) arguments, run help command for more info');
			}

			// codeType = null/undefined Or Type
			const codeType = await codeTypeChoice(message);
			let errors;
			if(codeType) {
				errors = argsValidation(args, codeType);
			} else {
				return;
			}

			console.log(errors);
			// If any errors are found, return the error message
			// Else delete the errors found key/pair
			if(errors.found) {
				return message.channel.send(errors.message);
			} else {
				delete errors.found;
			}

			// Construct a new Games model from the model
			const games = new Game({
				gameName: errors.name,
				gameKey: errors.key,
				gameType: errors.type,
				codeType: errors.codeType,
			});

			// Save the game to the database
			(async () => {
				try {
					await games.save();
					return message.channel.send('Game Added Successfully');
				} catch (err) {
					console.log('error: ' + err);
					return message.channel.send('Steam key already in database.');
				}
			})();

			console.log('Game added to Database');
			return;
		}
		// Delete can only work on server, not in dm's
		// Remember deleting other peopels messages is a permission
		// Wouldn't make sense to do this in a dm
		message.delete().catch();
		// DM the user the reply and send message to check dm
		message.reply('lets keep that between us. Check your dm\'s <3');
		return message.author.send(reply);
	},
};