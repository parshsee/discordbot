module.exports = {
    name: 'args-info',
    aliases: [],
    description: 'Test for taking multiple arguments',
    args: true,
    usage: '[arg1 arg2 arg3 etc]',
    execute(message, args) {
        if(args[0] === 'foo') {
            return message.channel.send('First argument was foo');
        }

        message.channel.send(`Arguments: ${args} \nArguments length: ${args.length}`);
    },
}