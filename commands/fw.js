const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID, isFinalWeek, isWithinWarDay, serverEmojis, clan } = require('../util.js');
const axios = require('axios');

module.exports = {
    name: 'fw',
    description: 'Get final week information',
    async execute (message, arg, mdbClient, API_KEY){
        
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));
        
        if(!(await isFinalWeek(API_KEY.token()))) return message.channel.send(embed.setDescription("This command is only available during the **final week** of war!"));

        //--------------------------------------- CODE -----------------------------------------

        const rr = await axios.get(`https://proxy.royaleapi.dev/v1/clans/%23${clan.tag}/currentriverrace`, { headers : { 'Authorization': 'Bearer ' + API_KEY.token() } }).catch(e => {console.log(e.response)});
        
        if(rr){
            const collection = mdbClient.db("Clan").collection("Matches");
            const oppCollection = mdbClient.db("Clan").collection("Opp Matches");
            const fame = serverEmojis.filter(e => e.name === "fame")[0].input;
            const swords = serverEmojis.filter(e => e.name === "swords")[0].input;
            let fwClans = [];
            let desc = "";

            for(const o of rr.data.clans){
                fwClans.push({"tag": o.tag, "name": o.name, "fame": o.fame, "trophies": o.clanScore});
            }

            //sort by fame
            fwClans.sort((a, b) => {
                return b.fame - a.fame;
            });

            for(const c of fwClans){
                const place = fwClans.indexOf(c) + 1;
                let maxAttacksLeft = 200;

                //if OL1 or OL2
                if(c.tag === "#"+clan.tag){
                    const matches = await collection.find({"clan": c.tag}).toArray();

                    for(const m of matches){
                        if(isWithinWarDay(m.battleTime)) maxAttacksLeft -= m.matchCount;
                    }
                }
                else{
                    const oppMatches = await oppCollection.find({"clan": c.tag}).toArray();

                    for(const m of oppMatches){
                        if(isWithinWarDay(m.battleTime)) maxAttacksLeft -= m.matchCount;
                    }
                }

                desc += `**${place}. __${c.name}__**\n${fame}${c.fame}\n${swords}Atks. Left: ~${maxAttacksLeft}\n\n`;
            }

            return message.channel.send(embed.setDescription(desc).setTitle(`__Final Week Attacks__`).setThumbnail("https://static.wikia.nocookie.net/clashroyale/images/9/9f/War_Shield.png/revision/latest/scale-to-width-down/250?cb=20180425130200"));
        }
    }
};