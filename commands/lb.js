const { logo, tag, hex, getMembers } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { serverEmojis } = require("../util/serverUtil");

module.exports = {
    name: 'lb',
    execute: async (message) => {
        const db = await mongoUtil.db("Clams");
        const collection = db.collection("Players");

        const memberTags = await getMembers(tag, true);
        const memberStats = await collection.find({tag: {$in: memberTags}, 'fameTotals.0': {$exists: true}}).toArray(); //members in clan currently, and have atleast 1 fame score in arr

        const average = arr => {
            let sum = 0;
            for(const n of arr){
                sum += n;
            }
            return (sum / arr.length).toFixed(0);
        }

        const under4kLb = memberStats.map(p => ({name: p.name, avgFame: average(p.fameTotals.filter(s => s.isUnder4k).map(s => s.fame))})).filter(p => p.avgFame !== 'NaN').sort((a, b) => b.avgFame - a.avgFame);
        const above4kLb = memberStats.map(p => ({name: p.name, avgFame: average(p.fameTotals.filter(s => !s.isUnder4k).map(s => s.fame))})).filter(p => p.avgFame !== 'NaN').sort((a, b) => b.avgFame - a.avgFame);

        const desc = () => {
            let str = `__**Above ${serverEmojis.find(e => e.name === 'cwtrophy').input}4k**__\n`;

            //above 4k
            for(let i = 0; i < 5; i++){
                if(i === 0) str += `🥇 **${above4kLb[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${above4kLb[i].avgFame})\n`;
                else if(i === 1) str += `🥈 **${above4kLb[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${above4kLb[i].avgFame})\n`;
                else if(i === 2) str += `🥉 **${above4kLb[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${above4kLb[i].avgFame})\n`;
                else str += `**${i+1}.** ${above4kLb[i].name} (${serverEmojis.find(e => e.name === 'fame').input}${above4kLb[i].avgFame})\n`;
            }

            str += `\n__**Below ${serverEmojis.find(e => e.name === 'cwtrophy').input}4k**__\n`;

            //udner 4k
            for(let i = 0; i < 5; i++){
                if(i === 0) str += `🥇 **${under4kLb[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${under4kLb[i].avgFame})\n`;
                else if(i === 1) str += `🥈 **${under4kLb[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${under4kLb[i].avgFame})\n`;
                else if(i === 2) str += `🥉 **${under4kLb[i].name}** (${serverEmojis.find(e => e.name === 'fame').input}${under4kLb[i].avgFame})\n`;
                else str += `**${i+1}.** ${under4kLb[i].name} (${serverEmojis.find(e => e.name === 'fame').input}${under4kLb[i].avgFame})\n`;
            }

            return str;
        };
        
        const lbEmbed = {
            color: hex,
            title: `__Clams Avg. Fame Leaders__`,
            description: desc(),
            thumbnail: {
                url: logo
            },
            footer: {
                text: 'Use ?stats to see your personal stats'
            }
        }

        message.channel.send({embed: lbEmbed});
        
    }
}