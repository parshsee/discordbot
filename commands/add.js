const jsonReader = require('../util/jsonReader');
const jsonWriter = require('../util/jsonWriter');
const jsonFormatter = require('../util/jsonFormatter');

function argsValidation(args) {
    let errors = {
        found: false,
    };
    //Check if there are at 3 argleast uments
    //Game Name (Can be multiple arguments), Key, Type
    if(args.length < 3) {
        errors.found = true;
        errors.message = 'Command needs three (3) arguments, run help command for more info';
        return errors;
    }
    //Sets the gameType, gameKey (array split by '-'), and gameName
    //Example Key: LLJNN-IF2XT-6NGVY
    //Should follow specified format
    //Game Name, Key, Type
    gameType = args[args.length - 1];
    gameKey = args[args.length - 2].split('-');
    gameName = ''

    for(let i = 0; i <= args.length - 3; i++) {
        gameName += args[i] + ' ';
    }

    //If game type isn't game, dlc, or other 
    //Return error w/ message
    if(!(gameType.toLowerCase() === 'game' || gameType.toLowerCase() === 'dlc' || gameType.toLowerCase() === 'other')) {
        errors.found = true;
        errors.message = 'Type can only be \'Game\', \'DLC\', or \'Other\'';
        return errors;
    }
    //If the Key array is less than 3 or greater than 3 (Steam Key should only have 3 after splitting by '-')
    //Return error w/ messaage
    if(gameKey.length < 3 || gameKey.length > 3) {
        errors.found = true;
        errors.message = 'Steam key not recognized. Make sure it is in the correct format';
        return errors;
    } else {
        //For every section of the key
        //Check that it's 5 letters long
        //--------Check that ALL the letters aren't numbers------ Small Possibility random steam code has all nunmbers
        //Check that all the letters are uppercase (numbers automatically come back as true, possible error)
        for(keyPart of gameKey) {
            if(keyPart.length < 5 || keyPart.length > 5) {
                errors.found = true;
                errors.message = 'Steam key not recognized. Make sure it is in the correct format';
                return errors;
            }
            // if(!isNaN(keyPart)) {
            //     errors.found = true;
            //     errors.message = 'Steam key not recognized. Make sure it is in the correct format';
            // }
            if(!(keyPart === keyPart.toUpperCase())) {
                errors.found = true;
                errors.message = 'Steam key not recognized. Make sure it is in the correct format';
                return errors;
            }
        }
    }

    //If no errors found
    //Set name = gameName
    //Set key = Full Steam Key (not split)
    //Set type = gameType
    errors.name = gameName;
    errors.key = args[args.length - 2];
    errors.type = gameType;
    return errors;
}

module.exports = {
    name: 'add',
    aliases: [],
    description: 'Adds the specified game and key to the database!',
    args: true,
    usage: '[game name] [key] [type: Game, DLC, Other]',
    async execute(message, args) {
        //Create a reply with sentence + their message 
        let reply = 'This command can only be used as a DM: \nia!add ';
        for(arg of args) {
            reply += arg + " ";
        }

        //If the message was sent in dm channel
        if(message.channel.type === 'dm') {
            //Validate the arguments passed to make sure its correct format
            const errors = argsValidation(args);
            //If any errors are found, return the error message
            //Else delete the errors found key/pair
            if(errors.found) {
                return message.channel.send(errors.message);
            } else {
                delete errors.found
            }

            //Get the jsonArray of the games file
            const jsonArray = await jsonReader('./games.json');
            //Add the formatted object from user arguments into the end
            //Turn the array into a JSON string
            jsonArray.push(errors);
            const jsonString = JSON.stringify(jsonArray);
            //Write to the games file (overwriting it with added game)
            await jsonWriter('./games.json', jsonString);
            //Format the file so the added game get alphabetized & ids get updated
            await jsonFormatter('./games.json');
            
            //Reply to user the success
            return message.channel.send("Game Added Successfully");
        }
        //Delete can only work on server, not in dm's
        //Remember deleting other peopels messages is a permission
        //Wouldn't make sense to do this in a dm
        message.delete().catch();
        //DM the user the reply
        return message.author.send(reply);
    }
}