const { max } = require("lodash");
const { logo, hex } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");

module.exports = {
    name: 'delete',
    execute: async (message, arg) => {
        const db = await mongoUtil.db("Clams");
        const collection = db.collection("Players");

        if(!arg) return message.channel.send({embed: {color: hex, description: '**No player tag given!** (Ex: `?insert #ABC123 2500)`'}});

        arg = arg.toUpperCase();
        const player = await collection.findOne({tag: arg});
        if(!player) return message.channel.send({embed: {color: hex, description: 'Player not found.'}});
        else if(player.fameTotals.length === 0) return message.channel.send({embed: {color: hex, description: 'Player has no data to delete.'}});

        const { name, fameTotals } = player;
        const mostRecentFame = fameTotals[fameTotals.length - 1];

        //send confirmatiom embed
        const confirmEmbed = await message.channel.send({embed: {color: hex, title: '__Delete Fame__', description: `Name: **${name}**\nTag: **${arg}**\nFame Score: **${mostRecentFame}**\n\nAre you sure you want to **delete** this data?`}});
                
        const emojis = ['✅', '❌'];
        for(const e of emojis) await confirmEmbed.react(e);
        const emojiCollector = await confirmEmbed.awaitReactions((r, u) => u.id === message.author.id && emojis.includes(r.emoji.name), {max: 1, time: 20000});
        const firstReact = emojiCollector.first();

        //check reaction
        if(!firstReact || firstReact._emoji.name === '❌'){
            confirmEmbed.delete();
        }
        else{
            const db = await mongoUtil.db("Clams");
            const collection = db.collection("Players");

            confirmEmbed.delete();

            await collection.updateOne({tag: arg}, { $pop: { fameTotals: 1 } });

            message.channel.send({embed: {color: hex, description: `✅ Deleted **${mostRecentFame}** from **${name}**!`}});
        }

    }
}