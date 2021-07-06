const { Client, Collection } = require('discord.js');
const fs = require('fs');
const { hex, tag } = require('./util/clanUtil');
const { prefix, token } = require('./config.json');
const { applyChannelID, commandsChannelID } = require('./util/serverUtil');
const { CronJob } = require('cron');
const { request, parseDate } = require('./util/otherUtil');
const mongoUtil = require('./util/mongoUtil');

const bot = new Client();
bot.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    bot.commands.set(command.name, command);
}

//JOBS
//add new race data every Monday at 5:30 AM CT
const updateRacesJob = new CronJob('0 30 5 * * 1', async () => {
    const db = await mongoUtil.db("Clams");
    const collection = db.collection("Races");

    const log = await request(`https://proxy.royaleapi.dev/v1/clans/%23${tag}/riverracelog`);
    const newClanWarsStartDate = parseDate('20210614T094000.000Z');

    for(const w of log.items){
        if(parseDate(w.createdDate) > newClanWarsStartDate){
            const clams = w.standings.find(c => c.clan.tag === '#V2GQU'); //Find our clan
            const totalFame = clams.clan.participants.reduce((a, b) => a + b.fame, 0);
            const weekExists = await collection.findOne({date: w.createdDate});

            //if not already in DB
            if(!weekExists)
                await collection.insertOne({date: w.createdDate, rank: clams.rank, trophyCount: clams.clan.clanScore, fame: totalFame});
        }
    }
}, null, true, 'America/Chicago');

bot.once('ready', async () => {
    console.log('Clams is online!');

    bot.user.setPresence({
        activity: {
            name: '?help'
        }
    });

    updateRacesJob.start();
});

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
        if((command === 'add' || command === 'insert' || command === 'delete') && message.channel.id !== '858600077710721074') return message.channel.send({embed: { color: hex, description: 'You cannot use that command here!'}});
        else if(command === 'apply' && message.channel.id !== applyChannelID) return message.channel.send({embed: { color: hex, description: 'You cannot use that command here!'}});
        else if((command !== 'add' && command !== 'insert' && command !== 'delete' && command !== 'apply') && message.channel.id !== commandsChannelID) return message.channel.send({embed: { color: hex, description: 'You cannot use that command here!'}});
        
        message.channel.startTyping();
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