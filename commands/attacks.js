const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID, clan, createAttacksEmbed, getMembers } = require('../util.js');

module.exports = {
    name: 'attacks',
    description: 'get list of players with unused attacks',
    async execute (message, arg, mdbClient, API_KEY){
        
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

        message.channel.startTyping();

        const members = await getMembers(clan.tag, API_KEY.token());
        embed.setThumbnail(clan.logo);

        message.channel.send(await createAttacksEmbed(embed, members, mdbClient));

        message.channel.stopTyping();
    }
};