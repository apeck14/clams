const { isNaN } = require("lodash");
const { hex, getPlayerData } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");

module.exports = {
    name: 'insert',
    execute: async (message, args) => {
        args = args.split(' ');
        if(args[0]) args[0] = args[0].toUpperCase();
        if(args[1]) args[1] = parseInt(args[1]);
        if(args.length !== 2 || typeof args[0] !== 'string' || isNaN(args[1])) return message.channel.send({embed: {color: hex, description: '**Incorrect parameters.** (Ex: `?insert #ABC123 2500)`'}});


        const { name } = await getPlayerData(args[0]);
        if(!name) return message.channel.send({embed: {color: hex, description: 'Invalid player tag.'}});

        //send confirmatiom embed
        const confirmEmbed = await message.channel.send({embed: {color: hex, title: '__Add Fame__', description: `Name: **${name}**\nTag: **${args[0]}**\nFame Score: **${args[1]}**\n\nAre you sure you want to **add** this data?`}});
                
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

            const player = await collection.findOne({tag: args[0]});

            //player not yet in database
            if(!player)
                await collection.insertOne({name: name, tag: args[0], fameTotals: [args[1]]});
            else
                await collection.updateOne(player, { $push: { fameTotals: args[1] } });

            message.channel.send({embed: {color: hex, description: `✅ Added **${args[1]}** to **${name}**!`}});
        }

    }
}