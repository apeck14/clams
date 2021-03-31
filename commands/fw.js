const { MessageEmbed } = require("discord.js")
const { isColosseumWeek, hex, tag, getAttacksLeft, name, logo } = require("../util/clanUtil");
const { LUFooter } = require("../util/lastUpdatedUtil");
const { request, mostRecentWarReset } = require("../util/otherUtil");
const { serverEmojis } = require("../util/serverUtil");

module.exports = {
    name: 'fw',
    execute: async (message, arg) => {
        if(!isColosseumWeek()) return message.channel.send(new MessageEmbed().setColor(hex).setDescription("This command is only available during **Colosseum** week!"));

        const colWeek = await request(`https://proxy.royaleapi.dev/v1/clans/%23${tag}/currentriverrace`);
        const clansByFame = colWeek.clans.sort((a, b) => b.fame - a.fame).map(c => ({name: c.name, tag: c.tag, fame: c.fame}));
        const fameEmoji = serverEmojis.find(e => e.name === "fame").input;

        const clanPromises = clansByFame.map(c => getAttacksLeft(mostRecentWarReset(), new Date(), c.tag));
        const clansAttacksLeftObj = await Promise.all(clanPromises);

        const desc = async () => {
            let desc = '';

            for(let i = 0; i < clansAttacksLeftObj.length; i++){
                const cObj = clansAttacksLeftObj[i];
                const c = clansByFame[i];

                let winPerc = (cObj.totalWins / (cObj.totalWins + cObj.totalLosses) * 100).toFixed(1);
                if(cObj.totalWins + cObj.totalLosses === 0) winPerc = '0.0%';
                
                if(c.name === name) desc += `__**${i+1}. ${c.name}**__\n${fameEmoji}: ${c.fame}\nToday's Win %: **${winPerc}%**\nAttacks Left: **${cObj.attacksLeft}**\n\n`;
                else desc += `**${i+1}. ${c.name}**\n${fameEmoji}: ${c.fame}\nToday's Win %: **${winPerc}%**\nAttacks Left: **${cObj.attacksLeft}**\n\n`;
            }

            return desc;
        }

        const fwEmbed = {
            color: hex,
            title: '__Colosseum Week__',
            description: await desc(),
            thumbnail: {
                url: logo
            },
            footer: {
                text: LUFooter()
            }
        }

        //log for bugs
        if(arg.toLowerCase() === 'log') clansAttacksLeftObj.forEach(c => console.dir(c));

        message.channel.send({ embed: fwEmbed });

    }
}