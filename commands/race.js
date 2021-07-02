const { logo, tag, hex } = require("../util/clanUtil");
const { request } = require("../util/otherUtil");
const { serverEmojis } = require("../util/serverUtil");

module.exports = {
    name: 'race',
    execute: async (message) => {
        const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${tag}/currentriverrace`);
        const isCololsseum = rr.periodType === 'colosseum';
        const score = (isCololsseum) ? 'fame' : 'periodPoints';
        const clans = rr.clans
                        .sort((a, b) => b[score] - a[score])
                        .map(c => ({
                            name: c.name,
                            medals: c[score],
                            attacksUsedToday: c.participants.reduce((a, b) => a + b.decksUsedToday, 0)
                        }));
        
        const battleDaysCompleted = () => {
            if ((rr.periodIndex - rr.periodLogs[rr.periodLogs.length - 1].periodIndex) <= 4) return 0;
            else return rr.periodIndex - rr.periodLogs[rr.periodLogs.length - 1].periodIndex - 4;
        }
        const avgFame = c => {
            if(isCololsseum){
                if(c.attacksUsedToday === 0 && battleDaysCompleted() === 0) return '0.0';
                return (c.medals / (c.attacksUsedToday + (200 * battleDaysCompleted()))).toFixed(1);
            }
            else{
                if(c.attacksUsedToday === 0) return '0.0';
                return (c.medals / c.attacksUsedToday).toFixed(1);
            }
        }

        const desc = () => {
            let str = ``;

            for (let i = 0; i < clans.length; i++) {
                const c = clans[i];

                if (c.name === 'Clash of Clams')
                    str += `__**${i+1}. ${c.name}**__\n${serverEmojis.find(e => e.name === "fame").input} **${c.medals}**\nAtks. Left: **${200 - c.attacksUsedToday}**\nAvg. Fame: **${avgFame(c)}**\n\n`;
                else
                    str += `**${i+1}. ${c.name}**\n${serverEmojis.find(e => e.name === "fame").input} **${c.medals}**\nAtks. Left: **${200 - c.attacksUsedToday}**\nAvg. Fame: **${avgFame(c)}**\n\n`;
            }

            return str;
        }

        const raceEmbed = {
            color: hex,
            title: `Current River Race`,
            thumbnail: {
                url: logo
            },
            description: desc(),
            footer: {
                text: (isCololsseum) ? 'Missed attacks negatively affect avg. fame' : ''
            }
        }

        message.channel.send({ embed: raceEmbed })
    }
}