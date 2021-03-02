const { hex, designatedChannelID, getMembers, clan } = require('../util.js');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'link',
    description: 'link a clash royale tag to their discord account',
    async execute (message, arg, mdbClient, API_KEY){
        const embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

        if(!arg) return message.channel.send(embed.setDescription("No player tag given! (Ex: **?link #ABC123**)"));
        else if(arg.indexOf('#') === -1) return message.channel.send(embed.setDescription("Invalid Clash Royale ID, make sure to include a #."));

        arg = arg.toUpperCase();

        //make sure the player is in clan
        let inClan = false;
        let name = "";
        const members = await getMembers(clan.tag, API_KEY.token());
        for(const mem of members){
            if(mem.tag === arg){
                name = mem.name;
                inClan = true;
            }
        }

        if(!inClan) return message.channel.send(embed.setDescription('Player ID not found in clan.'));
        
        try{
            const collection = mdbClient.db("Clan").collection("Linked Accounts");
            const linked = await collection.findOne({"discordID": message.author.id});

            //if user doesn't already have a linked account
            if(!linked){
                await collection.insertOne(
                    {   
                        discordName: message.author.username,
                        discordID: message.author.id,
                        tag: arg
                    }
                );

                return message.channel.send(embed.setDescription(`✅ Account linked to **${name}**!`));
            }
            //already linked to that tag
            else if(linked.tag === arg){
                return message.channel.send(embed.setDescription("You have already linked that ID!"));
            }
            //already linked, send confirmation embed to update to new tag
            else{
                //send confirmatiom embed
                const confirmEmbed = await message.channel.send(embed.setDescription(`Are you sure you want to link your account to a new ID?\n\n**Old ID:** ${linked.tag}\n**New ID:** ${arg}`));
                
                const emojis = ['✅', '❌'];
                for(const e of emojis) await confirmEmbed.react(e);
                const emojiCollector = await confirmEmbed.awaitReactions((r, u) => u.id === message.author.id && emojis.includes(r.emoji.name), {max: 1, time: 20000});
                const firstReact = emojiCollector.first();

                //check reaction
                if(!firstReact || firstReact._emoji.name === '❌'){
                    confirmEmbed.delete();
                }
                else{
                    confirmEmbed.delete();

                    await collection.updateOne({discordID: message.author.id}, { $set: {tag: arg}});

                    return message.channel.send(embed.setDescription("✅ Updated!"));
                }
            }
        } catch(e){
            console.dir(e);
            message.channel.send(embed.setDescription("Unexpected error."));
        }
    }
};