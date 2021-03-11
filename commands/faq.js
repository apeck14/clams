const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID } = require('../util.js');

module.exports = {
    name: 'faq',
    description: 'FAQ of the bot',
    async execute (message){
        
        let embed = new MessageEmbed().setColor(hex);

        if(message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

        const questions = [
            {q: "How often does the bot update matches?", a: "Every 5 mins."},
            {q: "Which matches are stored?", a: "All matches are stored, but only race/final week matches count towards stats."},
            {q: "How many matches are kept per player?", a: "Each players most recent 100 race/final week matches."},
            {q: "How are ties handled on the leaderboard?", a: "If two players have the same W/L %, then the player with more total matches played will be placed above. If that is equal too, then whichever player currently has more trophies."},
            {q: "What do underlined stats represent?", a: "The underlined stats count the matches within a duel individually. Not as 1 match, which would make an entire duel equal to a non-duel match."},
            {q: "When did matches start being tracked?", a: "3/2/21"}
        ];
        let desc = "";

        for(const q of questions){
            desc += `**__Q: ${q.q}__**\nA: ${q.a}\n\n`;
        }

        embed
            .setTitle("__FAQ__")
            .setFooter("Developed By: Apehk")
            .setDescription(desc);

        message.channel.send(embed);
    }
};