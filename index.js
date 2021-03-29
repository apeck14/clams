const { Client, Collection, MessageEmbed } = require('discord.js');
const fs = require('fs');
const { CronJob } = require('cron');
const mongoUtil = require('./util/mongoUtil');
const { getMembers, tag, updateWarMatches, isColosseumWeek, isRaceDay, name, hex, logo } = require('./util/clanUtil');
const { prefix } = require('./config.json');
const { request, sortArrByDate, getMinsDiff } = require('./util/otherUtil');
const { clanLogChannelID, missedAttacksChannelID, createAttacksEmbed, adminChannelID, commandsChannelID } = require('./util/serverUtil');
const { setLastUpdated } = require('./util/lastUpdatedUtil');

const bot = new Client();
bot.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    bot.commands.set(command.name, command);
}

// ----------------------- JOBS --------------------------------------
//send embed for who missed attacks everyday at 4:59 am
const missedAttacksJob = new CronJob('0 59 4 * * *', async () => {
    const members = await getMembers();
    await updateWarMatches(members);

    bot.channels.cache.get(missedAttacksChannelID).send({ embed: await createAttacksEmbed()});
}, null, true, 'America/Chicago');

// --------------------- MAIN ----------------------------------------

bot.once('ready', async () => {
    console.log('Clams is online!');

    bot.user.setPresence({
        activity: {
            name: '?help'
        }
    });

    missedAttacksJob.start();

    const mins = 5; //mins to update matches
    const interval = mins * 60 * 1000;
    const db = await mongoUtil.db("Clan");
    
    setInterval(async () => {
        //colosseum week
        if(await isColosseumWeek()){
            console.log('Updating matches...(colosseum)');

            const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${tag}/currentriverrace`);
            const clans = rr.clans.map(c => c.tag); //all river race clans

            //update matches for all clans in river race
            for(const c of clans){
                const members = await getMembers(c);
                await updateWarMatches(members, c);
            }
        }
        //race day (non-colosseum)
        else if(await isRaceDay()){
            console.log("Updating matches...(race)");

            const members = await getMembers();
            await updateWarMatches(members);
        }
        //non-race and non-colosseum
        else{
            console.log("Updating matches...");

            const races = db.collection("Races");
            const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${tag}/currentriverrace`);
            const log = await request(`https://proxy.royaleapi.dev/v1/clans/%23${tag}/riverracelog`);
            const startTime = `${log.items[0].createdDate.substr(0,9)}100000.000Z`;
            const finishTime = rr.clan.finishTime;

            const finishedClans = rr.clans.filter(c => c.finishTime);
            const place = sortArrByDate(finishedClans, 'finishTime').map(c => c.tag).indexOf("#"+tag) + 1;

            const race = {"clan": `${name}`, "place": place, "startTime": startTime, "finishTime": finishTime};
            const raceExists = await races.findOne(race);

            //if race not in DB
            if(!raceExists){
                console.log("------- NEW RACE ADDED -------");
                console.dir(race);
                console.log("------------------------------");

                races.insertOne(race);

                const desc = () => {
                    const diffMins = getMinsDiff(startTime, finishTime);
                    const timeToComplete = `${Math.floor(diffMins/60)}h ${diffMins % 60}m`;
                    let desc = "";

                    //add place to desc
                    if(place === 1) desc += "Place: :first_place:\n";
                    else if(place === 2) desc += "Place: :second_place:\n";
                    else if(place === 3) desc += "Place: :third_place:\n";
                    else desc += `Place: **${place}th**\n`;

                    //add time took to complete race
                    desc += `Time: **${timeToComplete}**\n`;

                    return desc;
                };

                const raceEmbed = {
                    color: hex,
                    title: 'Race Finished!',
                    thumbnail: {
                        url: logo
                    },
                    description: desc()
                }

                bot.channels.cache.get(clanLogChannelID).send({ embed: raceEmbed });
            }

            await updateWarMatches(await getMembers());
        }

        setLastUpdated();
    }, interval);
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
        if(bot.commands.get(command).adminCommand && message.channel.id !== adminChannelID) return message.channel.send(new MessageEmbed().setColor(hex).setDescription('You cannot use that command here!'));
        else if(command !== 'apply' && message.channel.id !== commandsChannelID) return message.channel.send(new MessageEmbed().setColor(hex).setDescription('You cannot use that command here!'));
        bot.commands.get(command).execute(message, args, bot);
    } catch(err) {
        console.error(err);
    }
});

bot.on('reconnecting', () => {
    console.log('Clams is reconnecting...');
});

bot.login(process.env.token);