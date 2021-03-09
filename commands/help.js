const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID } = require('../util.js');

module.exports = {
  name: 'help',
  description: 'get list of commands',
  async execute(message, arg) {
    const embed = new MessageEmbed().setColor(hex);

    if (message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));
    
    if (!arg) {
      embed
        .setTitle('__Commands__')
        .setDescription('• **?attacks <C>** - Get list of players with remaining war attacks\n• **?lb** - Get war leaderboard\n• **?stats <PLAYERTAG>** - Get war stats for a specific member\n• **?fw** - Get final week information for all opponents\n• **?overview** - Get the bottom performers/rated in the clan\n• **?matches** - Get all members most recent war match times\n\n**__Other__**\n• **?faq** - FAQ for the bot\n• **?link <PLAYERTAG>** - Link your Clash Royale ID');
    }

    message.channel.send(embed);
  },
};