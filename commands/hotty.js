const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID } = require('../util.js');

module.exports = {
    name: 'hotty',
    description: 'send pic of Rowdy',
    async execute (message){
        
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

        message.channel.send(embed.setImage("https://i.imgur.com/8BRXVpz.jpg"));
    }
};