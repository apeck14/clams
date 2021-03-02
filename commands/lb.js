const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID, createLBEmbed, getMembers, clan } = require('../util.js');

module.exports = {
    name: 'lb',
    description: 'get war leaderboard for OL',
    async execute (message, arg, mdbClient, API_KEY){
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

        message.channel.startTyping();

        let members = await getMembers(clan.tag, API_KEY.token());
        message.channel.send(await createLBEmbed(members, mdbClient));

        message.channel.stopTyping();
    }
};