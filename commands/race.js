const { logo, tag, hex } = require("../util/clanUtil");
const { request } = require("../util/otherUtil");
const { serverEmojis } = require("../util/serverUtil");

module.exports = {
    name: 'race',
    execute: async (message) => {
        const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${tag}/currentriverrace`);
        const score = (rr.periodType === 'colosseum') ? 'fame' : 'periodPoints';
        const clans = rr.clans
                        .sort((a, b) => b[score] - a[score])
                        .map(c => ({
                                name: c.name,
                                medals: c[score],
                                attacksUsedToday: c.participants.reduce((a, b) => a + b.decksUsedToday, 0)
                            }));

        const desc = () => {
            let str = ``;

            for (let i = 0; i < clans.length; i++) {
                const c = clans[i];
                if (c.name === 'Clash of Clams')
                    str += `__**${i+1}. ${c.name}**__\n${serverEmojis.find(e => e.name === "fame").input} **${c.medals}**\nAtks. Left: **${200 - c.attacksUsedToday}**\nAvg. Fame: **${(c.medals/c.attacksUsedToday).toFixed(1)}**\n\n`;
                else
                    str += `**${i+1}. ${c.name}**\n${serverEmojis.find(e => e.name === "fame").input} **${c.medals}**\nAtks. Left: **${200 - c.attacksUsedToday}**\nAvg. Fame: **${(c.medals/c.attacksUsedToday).toFixed(1)}**\n\n`;
            }

            return str;
        }

        const raceEmbed = {
            color: hex,
            title: `Current River Race`,
            thumbnail: {
                url: logo
            },
            description: desc()
        }

        message.channel.send({ embed: raceEmbed })
    }
}