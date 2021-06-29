const { logo, tag, hex } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { request } = require("../util/otherUtil");
const { serverEmojis } = require("../util/serverUtil");

module.exports = {
    name: 'add',
    execute: async (message) => {
        const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${tag}/currentriverrace`);
        const members = rr.clans.find(c => c.name === "Clash of Clams").participants.filter(p => p.decksUsed >= 16 && p.boatAttacks === 0).reverse();
        const reactionEmojis = ['✅', '❌', '⏭️'];

        if (members.length === 0)
            return message.channel.send({ embed: {color: hex, description: 'There are no players to add yet!'}});


        // SEND PLAYER EMBEDS W/ REACTIONS ------------------------------------------------------------
        for (const m of members) {
            const { tag, name, fame, decksUsed, decksUsedToday } = m;

            const memEmbed = await message.channel.send({
                embed: {
                    color: hex,
                    title: `${name} (${tag})`,
                    thumbnail: {
                        url: logo
                    },
                    description: `${serverEmojis.find(e => e.name === 'fame').input}**${fame}**\n\nDecks Used: **${decksUsed}**/28\nDecks Used Today: **${decksUsedToday}**/4`,
                    footer: {
                        text: `${members.indexOf(members.find(p => p.tag === tag)) + 1} of ${members.length}`
                    }
                }
            });

            for (const e of reactionEmojis) await memEmbed.react(e);
            const emojiCollector = await memEmbed.awaitReactions((r, u) => u.id === message.author.id && reactionEmojis.includes(r.emoji.name), { max: 1, time: 30000 });
            const firstReact = emojiCollector.first();

            //check reaction
            if (!firstReact || firstReact._emoji.name === '❌') {
                memEmbed.delete();
                await message.channel.send(`❌ **${name}** (${tag}): ${serverEmojis.find(e => e.name === 'fame').input}${fame}`)
            }
            else if (firstReact._emoji.name === '⏭️') {
                memEmbed.delete();
                return await message.channel.send(`⏭️ Skipped **${members.length - members.indexOf(m)}** member(s)!`);
            }
            else {
                const db = await mongoUtil.db("Clams");
                const collection = db.collection("Players");

                const playerExists = await collection.findOne({ "tag": tag });

                //if player not in database (new player)
                if (!playerExists)
                    await collection.insertOne({ name: name, tag: tag, fameTotals: [parseInt(fame)] });
                else
                    await collection.updateOne({ tag: tag }, { $push: { fameTotals: parseInt(fame) } });

                memEmbed.delete();
                await message.channel.send(`✅ **${name}** (${tag}): ${serverEmojis.find(e => e.name === 'fame').input}${fame}`);
            }

        }

    }
}