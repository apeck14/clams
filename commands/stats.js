const { logo, hex, tag, getMembers } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { CanvasRenderService } = require('chartjs-node-canvas');
const { serverEmojis } = require("../util/serverUtil");

module.exports = {
    name: 'stats',
    execute: async (message, arg) => {
        const db = await mongoUtil.db("Clams");
        const collection = db.collection("Players");
        const linkedCollection = db.collection('Linked Accounts');

        if (!arg) {
            const linkedAccount = await linkedCollection.findOne({ discordID: message.author.id });
            if (linkedAccount) arg = linkedAccount.tag;
            else return message.channel.send({ embed: { color: hex, description: 'You must give a player tag! (?stats #ABC123)' } });
        }
        arg = (arg[0] !== '#') ? `#${arg.toUpperCase()}` : arg.toUpperCase();

        const average = arr => {
            let sum = 0;
            for (const n of arr) {
                sum += n;
            }
            return (sum / arr.length).toFixed(0);
        }

        const player = await collection.findOne({ tag: arg });
        if (!player) return message.channel.send({ embed: { color: hex, description: 'Player not found. Try again.' } });

        const below4kFameTotals = player.fameTotals.filter(w => w.isUnder4k).map(s => s.fame);
        const above4kFameTotals = player.fameTotals.filter(w => !w.isUnder4k).map(s => s.fame);

        const chart = {
            type: 'line',
            data: {
                labels: (below4kFameTotals.length > above4kFameTotals.length) ? below4kFameTotals.map((f, i) => (`${i}`)) : above4kFameTotals.map((f, i) => (`${i}`)),
                datasets: [
                    {
                        label: 'Below 4k',
                        data: below4kFameTotals,
                        borderColor: hex,
                        backgroundColor: 'rgba(137, 213, 123, 0.23)',
                        fill: true
                    },
                    {
                        label: 'Above 4k',
                        data: above4kFameTotals,
                        borderColor: '#599163',
                        backgroundColor: 'rgba(89, 145, 99, 0.23)',
                        fill: true
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        ticks: {
                            stepSize: 200,
                            color: "white"
                        },
                        suggestedMin: 1600,
                        suggestedMax: 3600,
                        offset: true
                    },
                    x: {
                        display: false
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "white"
                        }
                    }
                }
            }
        }

        const width = 500;
        const height = 300;
        const canvas = new CanvasRenderService(width, height);
        const image = await canvas.renderToBuffer(chart);

        const memberTags = await getMembers(tag, true);
        const memberStats = await collection.find({tag: {$in: memberTags}, 'fameTotals.0': {$exists: true}}).toArray(); //members in clan currently, and have atleast 1 fame score in arr

        const desc = () => {
            const under4kLb = memberStats.map(p => ({name: p.name, tag: p.tag, avgFame: average(p.fameTotals.filter(s => s.isUnder4k).map(s => s.fame))})).filter(p => p.avgFame !== 'NaN').sort((a, b) => b.avgFame - a.avgFame);
            const above4kLb = memberStats.map(p => ({name: p.name, tag: p.tag, avgFame: average(p.fameTotals.filter(s => !s.isUnder4k).map(s => s.fame))})).filter(p => p.avgFame !== 'NaN').sort((a, b) => b.avgFame - a.avgFame);
            
            let str = `__**Below ${serverEmojis.find(e => e.name === 'cwtrophy').input}4k**__\n`; //under 4k
            str += `Avg. Fame: **${average(player.fameTotals.filter(w => w.isUnder4k).map(s => s.fame))}**\nClan Rank: **${under4kLb.findIndex(p => p.tag === player.tag) + 1}**`;

            str += `\n\n__**Above ${serverEmojis.find(e => e.name === 'cwtrophy').input}4k**__\n`; //above 4k
            str += `Avg. Fame: **${average(player.fameTotals.filter(w => !w.isUnder4k).map(s => s.fame))}**\nClan Rank: **${above4kLb.findIndex(p => p.tag === player.tag) + 1}**`;

            return str;
            
        }

        message.channel.send({
            embed: {
                color: hex,
                title: `__${player.name}'s Stats__`,
                description: desc(),
                thumbnail: {
                    url: logo
                },
                image: {
                    url: 'attachment://chart.png'
                },
                files: [{
                    attachment: image,
                    name: 'chart.png'
                }]
            }
        });

    }
}