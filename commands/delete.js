module.exports = {
	name: 'delete',
	aliases: ['prune'],
	description: 'Deletes the last message or a given number of messages (up to 100) in the channel from the last two weeks\n__*Only available to Mods*__',
	args: false,
	usage: ' --- Deletes the last message' +
			'\n**•**ia!delete [# of messages] --- Deletes the given number of messages',
	execute(message, args) {

		if(!message.member.roles.cache.some(role => role.name === 'Mods')) return message.channel.send('This command can only be done by Moderators (Mods)');

		// If no args given (i.e ia!delete)
		if(!args.length) {
			const removeAmount = 2;

			message.channel.bulkDelete(removeAmount, true).catch(err => {
				console.log(err);
				return message.channel.send('There was an error trying to delete some messages');
			});
		// If args given
		} else if(args.length === 1) {
			const removeAmount = parseInt(args[0]) + 1;

			if(isNaN(removeAmount)) {
				return message.channel.send('That doesn\'t seem to be a valid number');
			} else if(removeAmount <= 1 || removeAmount > 100) {
				return message.channel.send('You need to input a number between 1 and 99');
			} else {
				message.channel.bulkDelete(removeAmount, true).catch(err => {
					console.log(err);
					return message.channel.send('There was an error trying to delete some messages');
				});
			}
		// Else return error message
		} else {
			return message.channel.send('Command can only be used with no arguments or one (1) argument, run help command for more info');
		}
	},
};