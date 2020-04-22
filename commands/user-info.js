    //Using ` allows you to call varaibles into string like below. 
    // ` (above tab) is different from ' (quotes)
module.exports = {
    name: 'user-info',
    aliases: [],
    description: 'Displays user information!',
    args: false,
    usage: ' ',         //Space lets the usage show up when asking for it in commands
    execute(message, args) {
        //Send back message to channel the message was sent in
        message.channel.send(`Your username: ${message.author.username}\nYour ID: ${message.author.id}`);
    },
}