const { MessageEmbed } = require('discord.js');
const { hex, applyChannelID, playerRating, getMembers, applyLogChannelID, clan } = require('../util.js');
const axios = require('axios');

module.exports = {
    name: 'apply',
    description: 'apply to join Clams',
    async execute (message, arg, mdbClient, API_KEY, bot){
        
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== applyChannelID) return message.channel.send(embed.setDescription(`Please use this command in <#${applyChannelID}>!`));
        if(!arg) return message.channel.send(embed.setDescription("You must apply with your **player tag**! (Ex: ``?apply #ABC123``)"));

        message.channel.startTyping();

        const player = await axios.get(`https://proxy.royaleapi.dev/v1/players/%23${arg[0] === "#" ? arg.substr(1) : arg}`, { headers : { 'Authorization': 'Bearer ' + API_KEY.token() } }).catch(e => {
            console.log(e.response);
            message.channel.stopTyping();
        });

        if(player){
            let members = await getMembers(clan.tag, API_KEY.token(true));
            members = members.map(p => p.tag);
            let logEmbed = new MessageEmbed().setTitle("__New Request!__").setColor(hex).setThumbnail(clan.logo);
            
            const [clanRating, ratingObj] = await Promise.all([playerRating(members, API_KEY), playerRating(arg, API_KEY)]).catch(() => {
                message.channel.stopTyping();
                return message.channel.send(embed.setDescription("Unexpected error. Try again."));
            });

            const name = player.data.name;
            const tag = player.data.tag;
            const pb = player.data.bestTrophies;
            const cards = player.data.cards;
            const maxWins = player.data.challengeMaxWins;
            const classicChallBadge = player.data.badges.filter(b => b.name === "Classic12Wins");
            const grandChallBadge = player.data.badges.filter(b => b.name === "Grand12Wins");
            const classicChallWins = classicChallBadge.length === 1 ? classicChallBadge[0].progress : 0;
            const grandChallWins = grandChallBadge.length === 1 ? grandChallBadge[0].progress : 0;
            let cards13 = 0;
            let cards12 = 0;
            let cards11 = 0;
            let desc = "";

            for(c of cards){
                const diff = c.maxLevel - c.level;
                if(diff === 0) cards13++;
                else if(diff === 1) cards12++;
                else if(diff === 2) cards11++;
            }

            desc += `**Name**: ${name}\n**Tag**: ${tag}\n**Rating**: ${ratingObj.rating}\n**Clams Rating**: ${Math.round(clanRating)}\n\n**__Cards__**\n**Lvl. 13**: ${cards13}\n**Lvl. 12**: ${cards12}\n**Lvl. 11**: ${cards11}\n\n**__Stats__**\n**PB**: ${pb}\n**Most Chall. Wins**: ${maxWins}\n**Classic Chall. Wins**: ${classicChallWins}\n**Grand Chall. Wins**: ${grandChallWins}\n\n[RoyaleAPI Profile](https://royaleapi.com/player/${tag.substr(1)})`;

            message.channel.send(embed.setDescription(`✅ Request sent for **${player.data.name}**! A Co-Leader will DM you shortly.`));
            bot.channels.cache.get(applyLogChannelID).send(logEmbed.setDescription(desc));

            message.channel.stopTyping();
        }
        else{
            message.channel.stopTyping();
            return message.channel.send(embed.setDescription("Invalid player tag! Try again."));
        }
    }
};