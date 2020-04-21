//Require Node native filesystem module
const fs = require('fs');
//Require the Discord.js module
const Discord = require('discord.js');
//Require the config file, gets the prefix and token from it
const {prefix, token} = require('./config.json');

//Create a new Discord client (bot)
const client = new Discord.Client();
client.commands = new Discord.Collection();
//Return an array of all filenames in the directory with .js ending
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
	// with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}

//When the client is ready, run this code
//This event only triggers once, at the very beginning when logging in (hence the 'once')
client.once('ready', () => {
    console.log("Ready!");
    client.user.setUsername('Immature Bot');
    client.user.setActivity('you | ia!commands', { type: 'WATCHING' });
})


client.on('message', message => {
    //If the message doesn't start with the prefix || This bot sent the message, exit
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    //Slices off prefix (removes) and splits everything seperated by space into an array (regex accounts for multiple spaces)
    const args = message.content.slice(prefix.length).split(/ +/);
    //Gets the command, which should be the first in the array
    //Shift stores the command and removes it from the array
    //This is just the command name (i.e server, ping, user-info)
    const commandName = args.shift().toLowerCase(); 

    //The actual command object (file w/ properties)
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    //If there isn't a command with that name, exit
    if(!command) return;
    
    //Checks args property of relevant command and to see if any args were passed
    //If command requires arguments and no arguments provided (just command)
    if(command.args && !args.length) {
        return message.reply('you didn\'t provide any arguments!');
    }



    //Try to run the commands execute property
    //Catch and log any error and reply that there was a problem
    try {
        command.execute(message, args);
    } catch (error) {
        console.log(error);
        message.reply('There was an error trying to execute that command!');
    }

})



//Login in server with app token should be last line of code
client.login(token);


