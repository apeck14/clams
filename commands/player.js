const { MessageEmbed } = require("discord.js")
const { hex, getPlayerData, logo } = require("../util/clanUtil")

module.exports = {
    name: 'player',
    execute: async (message, arg) => {
        if(!arg) return message.channel.send(new MessageEmbed().setColor(hex).setDescription("No player tag given! (Ex: **?player #ABC123**)"));

        const player = await getPlayerData(arg);
        if(!player) return message.channel.send(new MessageEmbed().setDescription("Invalid tag, or unexpected error. Try again.").setColor(hex));

        const desc = () => {
            const lvl13Cards = player.cards.filter(c => c.maxLevel - c.level === 0).length;
            const lvl12Cards = player.cards.filter(c => c.maxLevel - c.level === 1).length;
            const lvl11Cards = player.cards.filter(c => c.maxLevel - c.level === 2).length;

            const top = `Clan: **${player.clan}**\n\n**Lvl.**: ${player.level}\n**Player Rating**: ${player.rating.toFixed(0)}\n\n`;
            const mid = `**__Stats__**\n**PB**: ${player.pb}\n**War Wins**: ${player.warWins}\n**Most Chall. Wins**: ${player.mostChallWins}\n**Classic Chall. Wins**: ${player.challWins}\n**Grand Chall. Wins**: ${player.grandChallWins}\n\n`;
            const bottom = `**__Cards__**\n**Lvl. 13**: ${lvl13Cards}\n**Lvl. 12**: ${lvl12Cards}\n**Lvl. 11**: ${lvl11Cards}`;

            return top + mid + bottom;
        }

        const playerEmbed = {
            color: hex,
            title: `${player.name} (${player.tag})`,
            thumbnail: {
                url: logo
            },
            description: desc()
        }

        message.channel.send({ embed: playerEmbed });
    }
}