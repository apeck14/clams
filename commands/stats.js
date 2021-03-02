const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID, createStatsEmbed } = require('../util.js');

module.exports = {
    name: 'stats',
    description: 'get war stats for a player',
    async execute (message, arg, mdbClient, API_KEY){
        
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

        const collection = mdbClient.db("Clan").collection("Matches");

        //check if account is linked in DB
        if(!arg){
            const accounts = mdbClient.db("Clan").collection("Linked Accounts");
            const account = await accounts.findOne({"discordID": message.author.id});

            //if not linked
            if(!account) message.channel.send(embed.setDescription("You don't have a linked account! Use `?link` to link your account."));
            else {
                message.channel.startTyping();

                message.channel.send(await createStatsEmbed(account.tag.toUpperCase(), collection, API_KEY));

                message.channel.stopTyping();
            }
        }
        else{
            if(arg.indexOf("#") === -1) return message.channel.send(embed.setDescription("Invalid player ID. Make sure to include a `#`!"));

            message.channel.startTyping();

            message.channel.send(await createStatsEmbed(arg.toUpperCase(), collection, API_KEY));

            message.channel.stopTyping();

        }
    }
};