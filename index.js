const { prefix } = require('./config');
const { clan, getMembers, setLastUpdated, clanLogChannelID, missedAttacksChannelID, isFinalWeek, isRaceDay, sortArrByDate, hex, getMinsDiff, updateWarMatches, createAttacksEmbed } = require('./util');
const { MessageEmbed, Client, Collection } = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const mdbClient = new MongoClient(process.env.uri, { useUnifiedTopology: true });
const { CronJob } = require('cron');
const { Token } = require('./token');

const API_KEY = new Token();

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

    await mdbClient.connect();

    const mins = 5; //mins to update matches
    const interval = mins * 60 * 1000;
    const collection = mdbClient.db("Clan").collection("Matches");
    
    //update database with all new war matches
    setInterval(async () => {
        const members = await getMembers(clan.tag, API_KEY.token());
        setLastUpdated(new Date());

        const rr = await axios.get(`https://proxy.royaleapi.dev/v1/clans/%23${clan.tag}/currentriverrace`, { headers : { 'Authorization': 'Bearer ' + API_KEY.token() } }).catch(e => {console.log(e)});

        if(rr){
            //final week
            if(await isFinalWeek(API_KEY.token())){
                const rrColletion = mdbClient.db("Clan").collection("Opp Matches");
                const rrClans = rr.data.clans.map(c => c.tag).filter(t => t !== `#${clan.tag}`);

                console.log(`Updating Matches... (Final Week)`);

                //update matches
                await updateWarMatches(members, collection, API_KEY.token(true), true);

                console.log(`Updating opponents matches...`);

                //update all opponents matches
                for(const c of rrClans){
                    const members = await getMembers(c, API_KEY.token());
                    await updateWarMatches(members, rrColletion, API_KEY.token(true), true);
                }
            }
            //non final week race days
            else if(await isRaceDay(API_KEY.token())){
                console.log(`Updating matches... (Race Day)`);

                //update matches
                await updateWarMatches(members, collection, API_KEY.token(true), true);
            }
            else{
                console.log(`Updating matches...`);

                const log = await axios.get(`https://proxy.royaleapi.dev/v1/clans/%23${clan.tag}/riverracelog`, { headers : { 'Authorization': 'Bearer ' + API_KEY.token() } }).catch(e => {console.log(e.response)});

                if(log){
                    const races = mdbClient.db("Clan").collection("Races");

                    const finishTime = rr.data.clan.finishTime;
                    const finishedClans = rr.data.clans.filter(c => c.finishTime);
                    const place = sortArrByDate(finishedClans, 'finishTime').map(c => c.tag).indexOf("#"+clan.tag) + 1;
                    const startTime = log.data.items[0].createdDate;
                    const diffMins = getMinsDiff(startTime, finishTime);
                    const timeToComplete = `${Math.floor(diffMins/60)}h ${diffMins % 60}m`;
                    
                    const lastRace = {"clan": `${clan.name}`, "place": place, "startTime": startTime, "finishTime": finishTime};
                    const raceExists = await races.findOne(lastRace);
    
                    await updateWarMatches(members, collection, API_KEY.token(true), false, startTime, finishTime);
    
                    //if race not already in DB, then add it and send embed
                    if(!raceExists){
                        console.log("------- NEW RACE ADDED -------");
                        console.dir(lastRace);
                        console.log("------------------------------");
    
                        await races.insertOne(lastRace);
    
                        //send embed that race has finished with race details
                        let embed = new MessageEmbed().setTitle(`Race Finished!`).setColor(hex).setThumbnail(clan.logo);
                        let desc = "";
    
                        //add place to desc
                        if(place === 1) desc += "Place: :first_place:\n";
                        else if(place === 2) desc += "Place: :second_place:\n";
                        else if(place === 3) desc += "Place: :third_place:\n";
                        else desc += `Place: **${place}th**\n`;
    
                        //add time took to complete race
                        desc += `Time: **${timeToComplete}**\n`;
    
                        bot.channels.cache.get(clanLogChannelID).send(embed.setDescription(desc));
                    }
                }
            }
        }
    }, interval);
    
    //send embed for who missed attacks every Tuesday at 3:59 am
    let missedAttacksMonJob = new CronJob('0 59 3 * * 2', async () => {
        let embed = new MessageEmbed().setColor(hex).setThumbnail(clan.logo);
        embed = await createAttacksEmbed(embed, await getMembers(clan.tag, API_KEY.token()), mdbClient);

        bot.channels.cache.get(missedAttacksChannelID).send(embed);
    }, null, true, 'America/Chicago');

    //send embed for who missed attacks every day (besides Monday and Tuesday) if final week
    let finalWeekMissedAttacksJob = new CronJob('0 59 3 * * 0,3-6', async () => {
        if(await isFinalWeek(API_KEY.token())){
            let embed = new MessageEmbed().setColor(hex).setThumbnail(clan.logo);
            embed = await createAttacksEmbed(embed, await getMembers(clan.tag, API_KEY.token()), mdbClient);
    
            bot.channels.cache.get(missedAttacksChannelID).send(embed);
        }
    }, null, true, 'America/Chicago');

    //send embeds for who missed attacks on Monday (week ends at ~3:43 AM CT)
    let finalWeekLastDayMissedAttacksJob = new CronJob('0 35 3 * * 1', async () => {
        if(await isFinalWeek(API_KEY.token())){
            let embed = new MessageEmbed().setColor(hex).setThumbnail(clan.logo);
            embed = await createAttacksEmbed(embed, await getMembers(clan.tag, API_KEY.token()), mdbClient);
    
            bot.channels.cache.get(missedAttacksChannelID).send(embed);
        }
    }, null, true, 'America/Chicago');

    //delete all non-race matches and opponent matches every Monday at 4:00am CT
    let deleteJob = new CronJob('0 0 4 * * 1', async () => {
        const collection = mdbClient.db("Clan").collection("Matches");
        const oppCollection = mdbClient.db("Clan").collection("Opp Matches");

        oppCollection.deleteMany({});
        collection.deleteMany({"raceDay": false});
        
        console.log("Deleted all Opp Matches from DB!")
        console.log("Deleted all non-race matches from DB!");
    }, null, true, 'America/Chicago');

    missedAttacksMonJob.start();
    deleteJob.start();
    finalWeekMissedAttacksJob.start();
    finalWeekLastDayMissedAttacksJob.start();
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
        bot.commands.get(command).execute(message, args, mdbClient, API_KEY, bot);
    } catch(err) {
        console.error(err);
    }
});

bot.on('reconnecting', () => {
    console.log('Clams is reconnecting...');
});

bot.login(token);