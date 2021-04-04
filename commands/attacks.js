const { createAttacksEmbed } = require("../util/serverUtil");
const { hex, logo } = require('../util/clanUtil');
const mongoUtil = require("../util/mongoUtil");
const { getSecsDiff } = require("../util/otherUtil");
const { LUFooter } = require("../util/lastUpdatedUtil");
const { groupBy } = require("lodash");

module.exports = {
    name: 'attacks',
    execute: async (message, arg) => {
        if(arg.toUpperCase() === 'C'){
            const db = await mongoUtil.db("Clan");
            const collection = db.collection("Matches");

            const matches = await collection.find({}).toArray();
            const groupedMatches = groupBy(matches, m => m.tag);

            const secondsInADay = 86400;

            const playersWithAttacksFinished = [];

            for(const tag in groupedMatches){
                let matchCount = 0;
                let mostRecentMatch = Infinity;

                for(const m of groupedMatches[tag]){
                    const diffSecs = getSecsDiff(m.battleTime);

                    if(diffSecs < secondsInADay){
                        if(diffSecs < mostRecentMatch) mostRecentMatch = diffSecs;
                        if(m.type === 'duel') matchCount += m.matchCount;
                        else matchCount++;
                    }
                }

                let str = '';
                //format most recent match string
                if(mostRecentMatch !== Infinity){
                    const days = Math.floor(mostRecentMatch / 86400);
                    const hours = Math.floor((mostRecentMatch - (days * 86400)) / 3600);
                    const mins = Math.floor((mostRecentMatch - (days * 86400) - (hours * 3600)) / 60);

                    if(days) str += `${days}d `;
                    if(hours) str += `${hours}h `;
                    if(mins) str += `${mins}m`;
                }

                if(matchCount >= 4) playersWithAttacksFinished.push({name: groupedMatches[tag][groupedMatches[tag].length - 1].name, secs: mostRecentMatch, timeStr: str});
            }

            playersWithAttacksFinished.sort((a,b) => {
                return a.secs - b.secs;
            });

            const playerCount = playersWithAttacksFinished.length;
            const desc = `Total Players: **${playerCount}**\n` + playersWithAttacksFinished.map(p => `\n• **${p.name}**: ${p.timeStr}`).join('');

            const attacksEmbed = {
                title: '__Completed War Attacks (Last 24 hrs.)__',
                color: hex,
                description: desc,
                footer: {
                    text: LUFooter()
                },
                thumbnail: {
                    url: logo
                }
            }

            message.channel.send({ embed: attacksEmbed });
        }
        else message.channel.send({ embed: await createAttacksEmbed() });
    }
}