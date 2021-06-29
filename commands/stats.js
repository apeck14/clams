const { logo, hex } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");

module.exports = {
    name: 'stats',
    execute: async (message, arg) => {
        const db = await mongoUtil.db("Clams");
        const collection = db.collection("Players");
        const linkedCollection = db.collection('Linked Accounts');

        if(!arg) {
            const linkedAccount = await linkedCollection.findOne({discordID: message.author.id});
            if(linkedAccount) arg = linkedAccount.tag;
            else return message.channel.send({embed: {color: hex, description: 'You must give a player tag! (?stats #ABC123)'}});
        }
        arg = (arg[0] !== '#') ? `#${arg}` : arg;

        const average = arr => {
            let sum = 0;
            for (const n of arr) {
                sum += n;
            }
            return (sum / arr.length).toFixed(0);
        }

        const player = await collection.findOne({ tag: arg });
        if(!player) return message.channel.send({embed: {color: hex, description: 'Player not found. Try again.'}});

        const chart = {
            type: 'line',
            data: {
                labels: player.fameTotals.map((f, i) => (`${i}`)),
                datasets: [
                    { label: 'Fame', data: player.fameTotals, fill: false, borderColor: hex }
                ]
            },
            options: {
                scales: {
                    xAxes: [{
                        ticks: {
                            display: false //remove x-axis labels
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            max: 4000,
                            stepValue: 500
                        }
                    }]
                },
                layout: {
                    padding: {
                        left: 0,
                        right: 15,
                        top: 0,
                        bottom: 0
                    }
                }
            }
        }
        const encodedChart = encodeURIComponent(JSON.stringify(chart));
        const chartUrl = `https://quickchart.io/chart?c=${encodedChart}`;

        message.channel.send({
            embed:
            {
                color: hex,
                title: `${player.name}'s Stats`,
                description: `Avg. Fame: **${average(player.fameTotals)}**\n\n**Weeks Counted:**\n${player.fameTotals.join(', ')}`,
                thumbnail: {
                    url: logo
                },
                image: {
                    url: chartUrl
                }
            }
        });

    }
}