const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID } = require('../util.js');

module.exports = {
    name: 'faq',
    description: 'FAQ of the bot',
    async execute (message){
        
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

        embed
            .setTitle("__FAQ__")
            .setFooter("Developed By: Apehk")
            .setDescription("**Q: How often does the bot track matches?**\nA: Every 5 minutes.\n\n**Q: Which matches are stored?**\nA: Race day and final week matches.\n\n**Q: How many matches are stored per player?**\nA: Each player's last 100 matches.\n\n**Q: How are ties handled on the leaderboard?**\nA: The player who has more total matches played will be placed above. If that is equal too, then the player that has more trophies.\n\n**Q: What do underlined stats represent?**\nA: The stats with an underline calculate duel matches individually. (Not as 1 match, which would give an entire duel equal value to a non-duel match)\n\n**Q: When did matches start being tracked?**\nA: 3/2/21");

        message.channel.send(embed);
    }
};