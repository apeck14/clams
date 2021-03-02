const { MessageEmbed } = require('discord.js');
const { hex, applyLogChannelID, getMembers, clan, playerRating } = require('../util.js');
const { groupBy } = require("lodash");

module.exports = {
    name: 'overview',
    description: 'Get overview of OL1 or OL2',
    async execute(message, arg, mdbClient, API_KEY) {
        const embed = new MessageEmbed().setColor(hex);

        if (message.channel.id !== applyLogChannelID) return message.channel.send(embed.setDescription(`This command can only be used in <#${applyLogChannelID}>!`));

        const collection = mdbClient.db("Clan").collection("Matches");
        const ogMembers = await getMembers(clan.tag, API_KEY.token());
        const results = await collection.find({"tag": {$in: ogMembers.map(mem => mem.tag)}, "raceDay": true, "won": {$ne: "N/A"}}).toArray();
        let winPercentages = [];
        let ratings = ogMembers.map(t => playerRating(t.tag, API_KEY));
        ratings = await Promise.all(ratings);
        let bottom5 = "";
        let bottom5Rating = "";
        let members = groupBy(results, mem => mem.tag);

        for(const mem in members){
            let name = "";
            let wins = 0;
            let losses = 0;

            for(const m of members[mem]){
                name = m.name;
                if(m.type === "War") (m.won) ? wins++ : losses++;
                else if(m.type === "Duel"){
                    if(m.won){
                        if(m.matchCount === 3) losses++;
                        wins += 2;
                    }
                    else{
                        if(m.matchCount === 3) wins++;
                        losses += 2;
                    }
                }
            }

            if(wins + losses >= 4){
                winPercentages.push({"name": name, "percent": ((wins / (wins+losses)) * 100).toFixed(0), "wins": wins, "losses": losses});
            }
        }

        winPercentages.sort((a, b) => {
            if(a.percent === b.percent){
                if(a.wins + a.losses === b.wins + b.losses) return winPercentages.indexOf(b) - winPercentages.indexOf(a);
                return (b.wins + b.losses) - (a.wins + a.losses);
            }
            return a.percent - b.percent;
        });

        ratings.sort((a, b) => {
            if(b.rating === a.rating) return a["Tournaments (30%)"] - b["Tournaments (30%)"];
            return a.rating - b.rating;
        });

        //add bottom 5 win % and ratings to strings
        for(let i = 0; i < 5; i++){
            const p = winPercentages[i];
            const pl = ratings[i];

            bottom5 += `\n• **${p.name}**: ${p.percent}% (${p.wins}-${p.losses})`;
            bottom5Rating += `\n• **${pl.name}**: (${pl.rating})`;
        }

        embed
            .setTitle(`Clams Overview`)
            .setThumbnail(clan.logo)
            .setFooter(`Only players with atleast 4 race day matches are considered.`)
            .setDescription(`__**Lowest War Win %'s**__${bottom5}\n\n**__Lowest Ratings__**${bottom5Rating}`);

        message.channel.send(embed);
        
    },
};