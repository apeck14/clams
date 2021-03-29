const { tag, getMembers, hex, logo } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { parseDate } = require("../util/otherUtil");

module.exports = {
    name: 'lb',
    execute: async (message) => {
        const db = await mongoUtil.db('Clan');
        const collection = db.collection('Matches');

        const members = await getMembers(tag, true);
        const matchesByMemberPromises = members.map(m => collection.find({tag: m}).toArray());
        const matchesByMember = await Promise.all(matchesByMemberPromises);

        const memberStats = [];

        for(member of matchesByMember){
            let wins = 0;
            let losses = 0;

            for(m of member){
                if(!m.isRaceMatch && !m.isColosseumMatch) continue;
                else if(m.type === 'boat') continue;

                const date = parseDate(m.battleTime);

                //non-colosseum (race match) on monday || colosseum non-race matches
                if((!m.isColosseumMatch && date.getUTCDay() === 1) || (m.isColosseumMatch && !m.isRaceMatch)){
                    if(m.type === 'battle') (m.won) ? wins++ : losses++;
                    else if(m.type === 'duel'){
                        if(m.matchCount === 2) (m.won) ? wins += 2 : losses += 2;
                        else{ //matchCount === 3
                            wins++;
                            losses++;
                            if(m.won === true) wins++;
                            else if(m.won === false) losses++;
                        }
                    }
                }
            }

            if(wins + losses !== 0) memberStats.push({name: member[member.length-1].name, wins: wins, losses: losses});

        }

        memberStats.sort((a, b) => {
            //if same %
            if((a.wins / (a.wins + a.losses)) === (b.wins / (b.wins + b.losses))) return (b.wins + b.losses) - (a.wins + a.losses);
            return (b.wins / (b.wins + b.losses)) - (a.wins / (a.wins + a.losses));
        })
        
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