module.exports = {
    name: 'args-info',
    aliases: [],
    description: 'Test for taking multiple arguments',
    args: true,
    execute(message, args) {
        if(args[0] === 'foo') {
            return message.channel.send('First argument was foo');
        }

        message.channel.send(`Arguments: ${args} \nArguments length: ${args.length}`);
    },
}