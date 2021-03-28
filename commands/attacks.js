const { createAttacksEmbed } = require("../util/serverUtil");
const { getAttacksLeft, hex, logo } = require('../util/clanUtil');
const mongoUtil = require("../util/mongoUtil");
const { parseDate, getMinsDiff } = require("../util/otherUtil");
const { LUFooter } = require("../util/lastUpdatedUtil");

module.exports = {
    name: 'attacks',
    execute: async (message, arg) => {
        if(arg.toUpperCase() === 'C'){
            const db = await mongoUtil.db("Clan");
            const collection = db.collection("Matches");

            const attacksLeftObj = await getAttacksLeft();
            const attacksCompleted = attacksLeftObj.remainingAttacks.filter(p => p.attacksLeft === 0);
            const noMatchesCompleted = attacksLeftObj.totalWins + attacksLeftObj.totalLosses === 0;
            const totalMembers = attacksCompleted.length;

            for(const p of attacksCompleted){
                const matches = await collection.find({tag: p.tag}).toArray();

                if(matches.length === 0) continue; //continue if no matches for player in DB

                let mostRecentMatch = new Date();
                mostRecentMatch.setUTCDate(mostRecentMatch.getUTCDate() - 1000);

                for(const m of matches){
                    const date = parseDate(m.battleTime);
                    if(date > mostRecentMatch) mostRecentMatch = date;
                }

                p.minsSinceLastAttack = getMinsDiff(mostRecentMatch);
            }

            //sort by mins since last attack in ascending order
            attacksCompleted.sort((a, b) => {return a.minsSinceLastAttack - b.minsSinceLastAttack});

            const desc = () => {
                if(!totalMembers) return 'No players have completed their attacks yet!'

                const lessThan60MinsAgo = attacksCompleted.filter(m => m.minsSinceLastAttack < 60).map(m => `\n•⭐ **${m.name}** (${m.minsSinceLastAttack%60}m)`).join('');
                const moreThan60MinsAgo = attacksCompleted.filter(m => m.minsSinceLastAttack >= 60).map(m => `\n•⭐ **${m.name}** (${Math.floor(m.minsSinceLastAttack/60)}h ${m.minsSinceLastAttack%60}m)`).join('');
                let desc = `**Total Members**: ${totalMembers}\n`;

                if(lessThan60MinsAgo.length > 0) desc += lessThan60MinsAgo;
                if(moreThan60MinsAgo.length > 0) desc += moreThan60MinsAgo;

                return desc;
            };

            const attacksEmbed = {
                color: hex,
                title: totalMembers ? '__Completed War Attacks__' : null,
                thumbnail: {
                    url: totalMembers ? logo : null
                },
                description: desc(),
                footer: {
                    text: noMatchesCompleted ? null : LUFooter()
                }
            }

            message.channel.send({ embed: attacksEmbed });
        }
        else message.channel.send({ embed: await createAttacksEmbed() });
    }
}