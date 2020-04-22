module.exports = {
    name: 'ping',
    aliases: [],
    description: 'Ping!',
    args: false,
    usage: ' ',
    execute(message, args) {
        //Send back message to channel the message was sent in
        message.channel.send('Pong.');
    },
};