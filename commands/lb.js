const { logo, tag, hex, getMembers } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { serverEmojis } = require("../util/serverUtil");

module.exports = {
    name: 'lb',
    execute: async (message, arg) => {
        const db = await mongoUtil.db("Clams");
        const collection = db.collection("Players");

        const memberTags = await getMembers(tag, true);
        const memberStats = await collection.find({tag: {$in: memberTags}, 'fameTotals.1': {$exists: true}}).toArray(); //members in clan currently, and have atleast 1 fame score in arr

        const average = arr => {
            let sum = 0;
            for(const n of arr){
                sum += n;
            }
            return (sum / arr.length).toFixed(0);
        }

        const leaderboard = memberStats.map(p => ({name: p.name, avgFame: average(p.fameTotals.map(s => s.fame))})).sort((a, b) => b.avgFame - a.avgFame);
        const indeces = (arg === 'full') ? leaderboard.length : 10;

        const desc = () => {
            let str = '';

            for(let i = 0; i < indeces; i++){
                if(i === 0) str += `🥇 **${leaderboard[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${leaderboard[i].avgFame})\n`;
                else if(i === 1) str += `🥈 **${leaderboard[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${leaderboard[i].avgFame})\n`;
                else if(i === 2) str += `🥉 **${leaderboard[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${leaderboard[i].avgFame})\n`;
                else str += `**${i+1}.** ${leaderboard[i].name} (${serverEmojis.find(e => e.name === 'fame').input}${leaderboard[i].avgFame})\n`;
            }

            return str;
        };
        
        const lbEmbed = {
            color: hex,
            title: `__Clams Avg. Fame Leaders__`,
            description: desc(),
            thumbnail: {
                url: logo
            }
        }

        message.channel.send({embed: lbEmbed});
        
    }
}