const { MessageEmbed } = require('discord.js');
const { hex, getMembers, clan, privateChannelID, isFinalWeek } = require('../util.js');
const { groupBy } = require("lodash");
const { time } = require('cron');

module.exports = {
    name: 'naughty',
    description: 'clams naughty list',
    async execute(message, arg, mdbClient, API_KEY) {
        const embed = new MessageEmbed().setColor(hex);

        if (message.channel.id !== privateChannelID) return message.channel.send(embed.setDescription(`This command can only be used in <#${privateChannelID}>!`));

        const parseDate = date => {
            if(date instanceof Date) return date;
            try{
                return new Date(Date.UTC(
                    date.substr(0, 4),
                    date.substr(4, 2) - 1,
                    date.substr(6, 2),
                    date.substr(9, 2),
                    date.substr(11, 2),
                    date.substr(13, 2),
                ));
            } catch(e) {
                console.log(`Error (parseDate): ${date}`);
            }
        };
        const isMorningMatch = date => {
            //glitch (Monday 9:30 AM UTC - 10:30 AM UTC)
            if(date.getUTCDay() === 1 && ((date.getUTCHours() === 9 && date.getUTCMinutes() >= 30) || (date.getUTCHours() === 10 && date.getUTCMinutes() <= 30))) return true;
            else if(date.getUTCDay() === 2 && (date.getUTCHours() === 10) || (date.getUTCHours() === 11 && date.getUTCMinutes() <= 45)) return true;
            return false;
        };

        const d = parseDate('20210302T113107.000Z');
        console.log(d.getUTCHours());
        console.log(d.getUTCDay());

        const collection = mdbClient.db("Clan").collection("Matches");
        const members = await getMembers(clan.tag, API_KEY.token());
        const results = await collection.find({ tag: { $in:  members.map(m => m.tag) }}).toArray();
        const matches = groupBy(results, m => m.tag);
        let nonGrinders = [];
        let desc = "";

        for(const t in matches){
            let name;
            let count = 0;
            for(const m of matches[t]){
                name = m.name;
                timeStamp = parseDate(m.battleTime);

                if(isMorningMatch(timeStamp)) count++;
            }

            if(!count) nonGrinders.push(name);
        }

        nonGrinders.sort();

        for(let p of nonGrinders){
            desc += `• **${p}**\n`;
        }

        message.channel.send(embed.setThumbnail('https://i.imgur.com/juC5MIt.jpg').setTitle(`__Rowdy's Naughty List__`).setDescription(`Total Members: **${nonGrinders.length}**\n\n` + desc).setFooter(`All players with no AM matches on Monday or Tuesday. (Mon.: glitch, Tues.: Within 1h45m of reset)`));

    },
};