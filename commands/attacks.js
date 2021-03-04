const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID, clan, createAttacksEmbed, getMembers, isWithinWarDay, getMinsDiff, addLUFooter } = require('../util.js');
const { groupBy } = require('lodash');

module.exports = {
    name: 'attacks',
    description: 'get list of players with unused attacks',
    async execute (message, arg, mdbClient, API_KEY){
        
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));


        //show completed matches, and time of last match
        if(arg.toLowerCase() === 'c'){
           const collection = mdbClient.db("Clan").collection("Matches");
           let memberTags = await getMembers(clan.tag, API_KEY.token())
           memberTags = memberTags.map(mem => mem.tag);
           const results = await collection.find({"tag": {$in: memberTags}}).toArray();
           const membersMatches = groupBy(results, mem => mem.tag);
           let finishedMembers = [];
           let desc = "";

            //check if each members last 4 matches are within the war day
           for(const mem in membersMatches){
               const len = membersMatches[mem].length;
               let attacksToday = 0;

               if(len > 4){
                   for(let i = len - 1; i >= len - 4; i--){
                       if(isWithinWarDay(membersMatches[mem][i].battleTime)) attacksToday += membersMatches[mem][i].matchCount;
                   }
               }

               //if player completed all matches today
               if(attacksToday >= 4){
                   const name = membersMatches[mem][len - 1].name;
                   const minsSinceLastMatch = getMinsDiff(membersMatches[mem][len - 1].battleTime);
                   finishedMembers.push({name: name, mins: minsSinceLastMatch});
               }

           }

           //sort finsihedMembers by time of most recent match
           finishedMembers.sort((a, b) => {
               return b.mins - a.mins;
           })

           for(const mem of finishedMembers){
               let relativeTime = `${Math.floor(mem.mins / 60)}h ${mem.mins % 60}m`;
               if(Math.floor(mem.mins / 60) === 0) relativeTime = relativeTime.substr(3);

               desc += `• **${mem.name}** (${relativeTime})\n`;
           }

           embed = embed.setTitle(`__Completed Attacks Times__`).setDescription(desc);

           return message.channel.send(addLUFooter(embed));
        }

        message.channel.startTyping();

        const members = await getMembers(clan.tag, API_KEY.token());
        embed.setThumbnail(clan.logo);

        message.channel.send(await createAttacksEmbed(embed, members, mdbClient));

        message.channel.stopTyping();
    }
};