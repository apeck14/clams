const { MessageEmbed } = require('discord.js');
const { hex, getMembers, clan, privateChannelID } = require('../util.js');
const { groupBy } = require("lodash");

module.exports = {
    name: 'naughty',
    description: 'Get overview of OL1 or OL2',
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
        //check if match is between 9:30 AM UTC and 10:30 AM UTC
        const isMorningMatch = date => {
            if(date.getUTCHours() === 9 || date.getUTCHours() === 10) return true;
            return false;
        };
        const mostRecentTenOClock = date => {
            if (date.getUTCHours() < 10) {
                date.setUTCDate(date.getUTCDate() - 1);
            }
            date.setUTCHours(10, 0, 0, 0);
            return date;
        };
        const getMinsDiff = (a, b) => {
            if(!b){
                if(typeof a === "string" && a.indexOf(".000Z") >= 0) a = parseDate(a);
                const diff = Math.abs(new Date() - a);
                const mins = Math.ceil((diff/1000)/60);
                return mins;
            }
            else{
                let start = parseDate(a);
                let finish = parseDate(b);
        
                const diff = Math.abs(start - finish);
                const mins = Math.floor((diff/1000)/60);
                return mins;
            }
        };

        

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
                if(isMorningMatch(parseDate(m.battleTime))) count++;
            }

            if(!count) nonGrinders.push(name);
        }

        let finalArr = [];

        //find avg time it takes to complete matches
        for(let p of nonGrinders){
            const results = await collection.find({name: p, raceDay: true}).toArray();
            let minutes = 0;

            for(const m of results) minutes += getMinsDiff(m.battleTime, mostRecentTenOClock(parseDate(m.battleTime)));

            minutes = Math.round(minutes / results.length);
            if(isNaN(minutes)) continue;

            finalArr.push({name: p, time: minutes});

        }
        finalArr.sort((a,b) => {return b.time - a.time});

        for(let p of finalArr){
            desc += `• **${p.name}** (${Math.floor(p.time/60)}h${p.time%60}m)\n`;
        }

        message.channel.send(embed.setThumbnail('https://i.imgur.com/juC5MIt.jpg').setTitle(`__Rowdy's Naughty List__`).setDescription(desc).setFooter(`All players with no AM matches. Average time to complete war matches on race days shown.`))

        
    },
};