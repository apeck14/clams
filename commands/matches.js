const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID, getMembers, clan, getMinsDiff } = require('../util.js');
const { groupBy } = require("lodash");

module.exports = {
    name: 'matches',
    description: 'get most recent match times of members',
    async execute (message, arg, mdbClient, API_KEY){
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

        const collection = mdbClient.db("Clan").collection("Matches");
        let tags = await getMembers(clan.tag, API_KEY.token());
        tags = tags.map(p => p.tag);
        const results = await collection.find({"tag": {$in: tags}}).toArray();
        const matches = groupBy(results, mem => mem.tag);
        let mostRecentMatches = [];
        let desc = "";
        
        //add most recent match object to array
        for(const mem in matches){
            const recent = matches[mem][matches[mem].length - 1];
            mostRecentMatches.push({name: recent.name, time: getMinsDiff(recent.battleTime)});
        }

        mostRecentMatches.sort((a, b) => {
            return a.time - b.time;
        })

        mostRecentMatches = mostRecentMatches.map(m => ({name: m.name, time: `${Math.floor(m.time / 60)}h ${m.time % 60}m`}));

        for(const p of mostRecentMatches){
            desc += `• **${p.name}** (${p.time})\n`;
        }

        return message.channel.send(embed.setTitle("__Most Recent War Match Times__").setDescription(desc))
    }
};