const { Client, Collection } = require('discord.js');
const fs = require('fs');
const { hex } = require('./util/clanUtil');
const { prefix } = require('./config.json');
const { applyChannelID, commandsChannelID } = require('./util/serverUtil');

const bot = new Client();
bot.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    bot.commands.set(command.name, command);
}

bot.once('ready', async () => {
    console.log('Clams is online!');

    bot.user.setPresence({
        activity: {
            name: '?help'
        }
    });
});

// -------------------------------------------------------------------

bot.on('disconnect', () => {
    console.log('Clams has disconnected.');
});

bot.on('err', e => {
    console.error(e);
});

bot.on('message', async message => {
    if(message.author.bot || !message.content.startsWith(prefix)) return;

    let args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    args = args.join(" ");

    if(!bot.commands.has(command)) return;

    try{
        message.channel.startTyping();

        if((command === 'add' || command === 'insert' || command === 'delete') && message.channel.id !== '858600077710721074') return message.channel.send({embed: { color: hex, description: 'You cannot use that command here!'}});
        else if(command === 'apply' && message.channel.id !== applyChannelID) return message.channel.send({embed: { color: hex, description: 'You cannot use that command here!'}});
        else if((command !== 'add' && command !== 'insert' && command !== 'delete' && command !== 'apply') && message.channel.id !== commandsChannelID) return message.channel.send({embed: { color: hex, description: 'You cannot use that command here!'}});

        bot.commands.get(command).execute(message, args, bot);

        message.channel.stopTyping();
    } catch(err) {
        console.error(err);
    }
});

bot.on('reconnecting', () => {
    console.log('Clams is reconnecting...');
});

bot.login(process.env.token);