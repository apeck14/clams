const { logo, tag, hex, getMembers } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { serverEmojis } = require("../util/serverUtil");

module.exports = {
    name: 'lb',
    execute: async (message) => {
        const db = await mongoUtil.db("Clams");
        const collection = db.collection("Players");

        const memberTags = await getMembers(tag, true);
        const memberStats = await collection.find({tag: {$in: memberTags}}).toArray();

        const average = arr => {
            let sum = 0;
            for(const n of arr){
                sum += n;
            }
            return (sum / arr.length).toFixed(0);
        }

        const leaderboard = memberStats.map(p => ({name: p.name, avgFame: average(p.fameTotals)})).sort((a, b) => b.avgFame - a.avgFame);

        const desc = () => {
            let str = '';

            for(let i = 0; i < 10; i++){
                if(i === 0) str += `🥇 **${leaderboard[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${leaderboard[i].avgFame})\n`;
                else if(i === 1) str += `🥈 **${leaderboard[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${leaderboard[i].avgFame})\n`;
                else if(i === 2) str += `🥉 **${leaderboard[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${leaderboard[i].avgFame})\n`;
                else str += `**${i+1}.** ${leaderboard[i].name} (${serverEmojis.find(e => e.name === 'fame').input}${leaderboard[i].avgFame})\n`;
            }

            return str;
        };

        message.channel.send({embed:
            {
                color: hex,
                title: `__Clams War Leaderboard__`,
                description: desc(),
                thumbnail: {
                    url: logo
                }
            }
        });
        
    }
}