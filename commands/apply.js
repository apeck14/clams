const { MessageEmbed } = require("discord.js");
const { getPlayerData, hex, logo } = require("../util/clanUtil");
const { applicationsChannelID, applyChannelID } = require("../util/serverUtil");

module.exports = {
    name: 'apply',
    execute: async (message, arg, bot) => {
        if (message.channel.id !== applyChannelID) return message.channel.send(new MessageEmbed().setColor(hex).setDescription("This command cannot be used here!"));
        else if (!arg) return message.channel.send(new MessageEmbed().setColor(hex).setDescription("No player tag given! (Ex: **?player #ABC123**)"));

        arg = arg[0] === "#" ? arg.substr(1) : arg;

        const player = await getPlayerData(arg);
        if (!player) return message.channel.send(new MessageEmbed().setDescription("Invalid tag! Try again.").setColor(hex));

        const desc = async () => {
            const lvl13Cards = player.cards.filter(c => c.maxLevel - c.level === 0).length;
            const lvl12Cards = player.cards.filter(c => c.maxLevel - c.level === 1).length;
            const lvl11Cards = player.cards.filter(c => c.maxLevel - c.level === 2).length;

            const top = `Name: **${player.name}**\nTag: **${player.tag}**\nClan: **${player.clan}**\n\n**Lvl.**: ${player.level}\n\n`;
            const mid = `**__Stats__**\n**PB**: ${player.pb}\n**War Wins**: ${player.warWins}\n**Most Chall. Wins**: ${player.mostChallWins}\n**Classic Chall. Wins**: ${player.challWins}\n**Grand Chall. Wins**: ${player.grandChallWins}\n\n`;
            const bottom = `**__Cards__**\n**Lvl. 13**: ${lvl13Cards}\n**Lvl. 12**: ${lvl12Cards}\n**Lvl. 11**: ${lvl11Cards}\n\n[RoyaleAPI Profile](https://royaleapi.com/player/${arg})`;
            return top + mid + bottom;
        }

        const applicationEmbed = {
            color: hex,
            title: `__New Request!__`,
            thumbnail: {
                url: logo
            },
            description: await desc()
        };

        const confirmationEmbed = {
            color: hex,
            description: `✅ Request sent for **${player.name}**! A Co-Leader will DM you shortly.`
        };

        message.channel.send({ embed: confirmationEmbed });
        bot.channels.cache.get(applicationsChannelID).send({ embed: applicationEmbed });
    }
}