const { hex, logo, clanWarStats } = require("../util/clanUtil");

module.exports = {
    name: 'lb',
    execute: async (message) => {
        const memberStats = await clanWarStats();
        
        const desc = () => {
            const top10 = memberStats.filter(p => memberStats.indexOf(p) < 10);
            let desc = '';

            for(let i = 0; i < 10; i++){
                const p = top10[i];
                if(i === 0) desc += `:first_place: **${p.name}**: ${p.wins}-${p.losses}`;
                else if(i === 1) desc += `\n:second_place: **${p.name}**: ${p.wins}-${p.losses}`;
                else if(i === 2) desc += `\n:third_place: **${p.name}**: ${p.wins}-${p.losses}`;
                else desc += `\n${i+1}. **${p.name}**: ${p.wins}-${p.losses}`;
            }

            return desc;
        }

        const lbEmbed = {
            color: hex,
            title: '__Clams War Leaderboard__',
            description: desc(),
            thumbnail: {
                url: logo
            }
        }

        message.channel.send({ embed: lbEmbed });
    }
}