const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID, clan } = require('../util.js');
const axios = require('axios');

module.exports = {
    name: 'race',
    description: 'get war leaderboard for OL',
    async execute (message, arg, mdbClient, API_KEY){
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

        const rr = await axios.get(`https://proxy.royaleapi.dev/v1/clans/%23V2GQU/currentriverrace`, { headers : { 'Authorization': 'Bearer ' + API_KEY.token() } });
        const clans = rr.data.clans.map(c => ({name: c.name, fame: c.fame})).sort((a, b) => {return b.fame - a.fame});
        let desc = "";

        for(let i = 0; i < clans.length; i++){
            if(clans[i].name === clan.name) desc += `__**${i+1}**. **${clans[i].name}**: ${clans[i].fame}__\n`;
            else desc += `**${i+1}**. **${clans[i].name}**: ${clans[i].fame}\n`;
        }

        message.channel.send(embed.setTitle("__Current River Race__").setDescription(desc).setThumbnail('https://static.wikia.nocookie.net/clashroyale/images/9/9f/War_Shield.png/revision/latest/scale-to-width-down/340?cb=20180425130200'));
    }
};