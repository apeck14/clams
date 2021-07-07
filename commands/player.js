const { MessageEmbed } = require("discord.js");
const { hex, getPlayerData, logo } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");

module.exports = {
    name: 'player',
    execute: async (message, arg) => {
        if (!arg) {
            const db = await mongoUtil.db("Clams");
            const linkedCollection = db.collection('Linked Accounts');
            const linkedAccount = await linkedCollection.findOne({ discordID: message.author.id });

            if (linkedAccount) arg = linkedAccount.tag;
            else return message.channel.send({ embed: { color: hex, description: 'You must give a player tag! (?stats #ABC123)' } });
        }
        arg = (arg[0] !== '#') ? `#${arg.toUpperCase()}` : arg.toUpperCase();

        const player = await getPlayerData(arg);
        if(!player) return message.channel.send(new MessageEmbed().setDescription("Invalid player tag.").setColor(hex));

        const desc = () => {
            const lvl13Cards = player.cards.filter(c => c.maxLevel - c.level === 0).length;
            const lvl12Cards = player.cards.filter(c => c.maxLevel - c.level === 1).length;
            const lvl11Cards = player.cards.filter(c => c.maxLevel - c.level === 2).length;

            const top = `Clan: **${player.clan}**\n\n**Lvl.**: ${player.level}\n\n`;
            const mid = `**__Stats__**\n**PB**: ${player.pb}\n**War Wins**: ${player.warWins}\n**Most Chall. Wins**: ${player.mostChallWins}\n**Classic Chall. Wins**: ${player.challWins}\n**Grand Chall. Wins**: ${player.grandChallWins}\n\n`;
            const bottom = `**__Cards__**\n**Lvl. 13**: ${lvl13Cards}\n**Lvl. 12**: ${lvl12Cards}\n**Lvl. 11**: ${lvl11Cards}\n\n[RoyaleAPI Profile](https://royaleapi.com/player/${arg})`;
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