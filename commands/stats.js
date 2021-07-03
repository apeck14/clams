const { logo, hex } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { CanvasRenderService } = require('chartjs-node-canvas');

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

        const chart = {
            type: 'line',
            data: {
                labels: player.fameTotals.map((f, i) => (`${i}`)),
                datasets: [{
                    label: 'Fame',
                    data: player.fameTotals,
                    borderColor: hex,
                    backgroundColor: 'rgba(137, 213, 123, 0.23)',
                    fill: true
                }]
            },
            options: {
                scales: {
                    y: {
                        ticks: {
                            stepSize: 600,
                            color: "#dcdcdc"
                        },
                        min: 0,
                        max: 3600,
                        offset: true
                    },
                    x: {
                        display: false
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "#dcdcdc"
                        }
                    }
                }
            }
        }

        const width = 500;
        const height = 300;
        const canvas = new CanvasRenderService(width, height);
        const image = await canvas.renderToBuffer(chart);

        message.channel.send({
            embed: {
                color: hex,
                title: `${player.name}'s Stats`,
                description: `Avg. Fame: **${average(player.fameTotals)}**\n\n**Weeks Counted:**\n${player.fameTotals.join(', ')}`,
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