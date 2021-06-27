const { Client, Collection, MessageEmbed } = require('discord.js');
const fs = require('fs');
const { CronJob } = require('cron');
const mongoUtil = require('./util/mongoUtil');
const { getMembers, tag, updateWarMatches, isColosseumWeek, isRaceDay, name, hex, logo } = require('./util/clanUtil');
const { prefix } = require('./config.json');
const { request, sortArrByDate, getMinsDiff } = require('./util/otherUtil');
const { clanLogChannelID, missedAttacksChannelID, createAttacksEmbed, adminChannelID, applyChannelID, commandsChannelID } = require('./util/serverUtil');
const { setLastUpdated } = require('./util/lastUpdatedUtil');

const bot = new Client();
bot.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    bot.commands.set(command.name, command);
}


// --------------------- MAIN ----------------------------------------

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
    if(message.channel.id === "816445569777139712") console.log(`${message.author.username}: ${message.content}`);
    if(message.author.bot || !message.content.startsWith(prefix)) return;

    let args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    args = args.join(" ");

    if(!bot.commands.has(command)) return;

    try{
        message.channel.startTyping();

        if(bot.commands.get(command).adminCommand && message.channel.id === adminChannelID) bot.commands.get(command).execute(message, args, bot);
        else if(command === 'apply' && message.channel.id === applyChannelID) bot.commands.get(command).execute(message, args, bot);
        else if(command === 'add' && message.channel.id === '858600077710721074') bot.commands.get(command).execute(message, args, bot);
        else if(command !== 'apply' && !bot.commands.get(command).adminCommand && message.channel.id === commandsChannelID) bot.commands.get(command).execute(message, args, bot);
        else message.channel.send(new MessageEmbed().setColor(hex).setDescription('You cannot use that command here!'));

        message.channel.stopTyping();
    } catch(err) {
        console.error(err);
    }
});

bot.on('reconnecting', () => {
    console.log('Clams is reconnecting...');
});

bot.login(process.env.token);