const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID, getMinsDiff, isWithinWarDay, addLUFooter } = require('../util.js');
const axios = require('axios');
const { groupBy } = require('lodash');

module.exports = {
    name: 'active',
    description: 'determine if the clan should start attacking boats',
    async execute (message, arg, mdbClient, API_KEY){
        let embed = new MessageEmbed().setColor(hex).setThumbnail("https://cdn.royaleapi.com/static/img/badge/legendary-1/A_Char_Goblin_01.png?t=df40fd13c");

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

        const collection = mdbClient.db("Clan").collection("Matches");
        const clan = await axios.get(`https://proxy.royaleapi.dev/v1/clans/%23V2GQU/members`, { headers : { 'Authorization': 'Bearer ' + API_KEY.token() } });
        const lastSeen = clan.data.items.map(p => ({name: p.name, tag: p.tag, lastSeen: p.lastSeen})).filter(p => getMinsDiff(p.lastSeen) <= 10);
        const results = await collection.find({"tag": {$in: lastSeen.map(mem => mem.tag)}}).toArray();
        const matches = groupBy(results, mem => mem.tag);

        const winFame = 192;
        const lossFame = 96;
        let recentPlayersWithAttacks = 0;
        let attacksAvailable = 0;
        let desc = "";

        for(const tag in matches){
            let count = 0;

            for(const m of matches[tag]){
                if(isWithinWarDay(m.battleTime)){
                    count += m.matchCount;
                }
            }

            if(count < 4){
                const attacksLeft = 4 - count;
                recentPlayersWithAttacks++;
                attacksAvailable += attacksLeft;
                lastSeen.find(p => p.tag === tag).attacksLeft = attacksLeft;
            }
        }

        const onlyPlayersWithAttacks = lastSeen.filter(p => p.attacksLeft).sort((a, b) => {return b.attacksLeft - a.attacksLeft});
        const fameEstimation50WinRate = (Math.floor(attacksAvailable / 2) * lossFame) + (Math.ceil(attacksAvailable / 2) * winFame);
        const fameEstimationLosses = lossFame * attacksAvailable;

    
        if(onlyPlayersWithAttacks.length > 0){
            desc += `**Players w/ Attacks**: ${recentPlayersWithAttacks}\n**Attacks Available**: ${attacksAvailable}\n**Fame (50% W/L)**: ~${fameEstimation50WinRate}\n**Fame (All losses)**: ~${fameEstimationLosses}\n\n**__Players__**\n`;

            for(const p of onlyPlayersWithAttacks){
                desc += `• **${p.name}** (${p.attacksLeft})\n`;
            }
        }
        else{
            desc = "All active players have completed war attacks!"
            return message.channel.send(embed.setDescription(desc).setThumbnail());
        }

        message.channel.send(addLUFooter(embed.setTitle(`__Active Players (10 mins)__`).setDescription(desc)));
    }
};