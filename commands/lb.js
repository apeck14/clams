const { hex, logo, clanWarStats } = require("../util/clanUtil");
const { LUFooter } = require("../util/lastUpdatedUtil");

module.exports = {
    name: 'lb',
    execute: async (message, arg) => {
        const memberStats = await clanWarStats();

        const totalWins = memberStats.reduce((a, b) => a + b.wins, 0);
        const totalLosses = memberStats.reduce((a, b) => a + b.losses, 0);
        
        const desc = () => {
            let members;
            let desc = '';

            if(arg.toLowerCase() === 'full'){
                members = memberStats;
                desc += `**Clan W/L %**: ${(totalWins/(totalWins+totalLosses)*100).toFixed(1)}% (${totalWins}-${totalLosses})\n\n`;
            }
            else members = memberStats.filter(p => memberStats.indexOf(p) < 10);

            for(let i = 0; i < members.length; i++){
                const p = members[i];
                if(i === 0) desc += `:first_place: **${p.name}**: ${(p.wins / (p.wins + p.losses) * 100).toFixed(0)}% (${p.wins}-${p.losses})`;
                else if(i === 1) desc += `\n:second_place: **${p.name}**: ${(p.wins / (p.wins + p.losses) * 100).toFixed(0)}% (${p.wins}-${p.losses})`;
                else if(i === 2) desc += `\n:third_place: **${p.name}**: ${(p.wins / (p.wins + p.losses) * 100).toFixed(0)}% (${p.wins}-${p.losses})`;
                else desc += `\n${i+1}. **${p.name}**: ${(p.wins / (p.wins + p.losses) * 100).toFixed(0)}% (${p.wins}-${p.losses})`;
            }

            return desc;
        }

        const lbEmbed = {
            color: hex,
            title: '__Clams War Leaderboard__',
            description: desc(),
            thumbnail: {
                url: logo
            },
            footer: {
                text: LUFooter()
            }
        }

        message.channel.send({ embed: lbEmbed });
    }
}