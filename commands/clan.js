const { hex, logo } = require("../util/clanUtil");
const { parseDate } = require("../util/otherUtil");
const mongoUtil = require('../util/mongoUtil');
const { CanvasRenderService } = require('chartjs-node-canvas');
const mergeImg = require('merge-img');

module.exports = {
    name: 'clan',
    execute: async (message) => {
        const db = await mongoUtil.db("Clams");
        const collection = db.collection("Races");

        const races = (await collection.find({}).toArray()).sort((a, b) => parseDate(a.date) - parseDate(b.date));
        const weeksAbove4k = races.filter(w => w.trophyCount >= 4000);
        const weeksBelow4k = races.filter(w => w.trophyCount < 4000);

        const average = arr => {
            let sum = 0;
            for (const n of arr) {
                sum += n;
            }
            return (sum / arr.length).toFixed(0);
        }

        const below4kChart = {
            type: 'line',
            data: {
                labels: weeksBelow4k.map(r => (`${parseDate(r.date).getMonth() + 1}/${parseDate(r.date).getDate()}`)),
                datasets: [{
                    label: 'Fame',
                    data: weeksBelow4k.map(r => r.fame),
                    borderColor: hex,
                    backgroundColor: 'rgba(137, 213, 123, 0.23)',
                    fill: true
                }]
            },
            options: {
                scales: {
                    y: {
                        ticks: {
                            stepSize: 10000,
                            color: "white"
                        },
                        min: 80000,
                        max: 180000,
                        offset: true
                    },
                    x: {
                        ticks: {
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "white"
                        }
                    },
                    title: {
                        color: 'white',
                        text: 'Weeks Below 4k',
                        display: true,
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }

        const above4kChart = {
            type: 'line',
            data: {
                labels: weeksAbove4k.map(r => (`${parseDate(r.date).getMonth() + 1}/${parseDate(r.date).getDate()}`)),
                datasets: [{
                    label: 'Fame',
                    data: weeksAbove4k.map(r => r.fame),
                    borderColor: '#599163',
                    backgroundColor: 'rgba(89, 145, 99, 0.23)',
                    fill: true
                }]
            },
            options: {
                scales: {
                    y: {
                        ticks: {
                            stepSize: 10000,
                            color: "white"
                        },
                        min: 80000,
                        max: 180000,
                        offset: true
                    },
                    x: {
                        ticks: {
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "white"
                        }
                    },
                    title: {
                        color: 'white',
                        text: 'Weeks Above 4k',
                        display: true,
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }

        const width = 500;
        const height = 300;
        const canvas = new CanvasRenderService(width, height);
        const below4kImage = await canvas.renderToBuffer(below4kChart);
        const above4kImage = await canvas.renderToBuffer(above4kChart);

        function getBuffer(img) {
            return new Promise((fulfill, reject) => {
                img.getBuffer('image/png', (err, buffer) => {
                    if (err) {
                        return reject(err);
                    }
                    fulfill(buffer);
                });
            })
        }

        mergeImg([below4kImage, above4kImage], { direction: true }) //merge images on top of one another
            .then(async b64 => {
                const below4kAvgFame = weeksBelow4k.length === 0 ? 'N/A' : average(weeksBelow4k.map(r => r.fame));
                const above4kAvgFame = weeksAbove4k.length === 0 ? 'N/A' : average(weeksAbove4k.map(r => r.fame));
                const below4kTotals = weeksBelow4k.length === 0 ? 'N/A' : weeksBelow4k.map(r => r.fame).join(', ');
                const above4kTotals = weeksAbove4k.length === 0 ? 'N/A' : weeksAbove4k.map(r => r.fame).join(', ');

                return message.channel.send({
                    files: [{
                        attachment: await getBuffer(b64),
                        name: 'chart.png'
                    }],
                    embed: {
                        color: hex,
                        title: `__Clams Weekly Race Data__`,
                        description: `__**Below 4k:**__\nAvg. Fame: **${below4kAvgFame}**\n**Weeks Counted:**\n${below4kTotals}\n\n__**Above 4k:**__\nAvg. Fame: **${above4kAvgFame}**\n**Weeks Counted:**\n${above4kTotals}`,
                        thumbnail: {
                            url: logo
                        },
                        image: {
                            url: 'attachment://chart.png'
                        }
                    }
                });
            })
            .catch(e => {
                console.log(e);
                return message.channel.send({ embed: { color: hex, description: 'Unexpected error.' } });
            });
    }
}