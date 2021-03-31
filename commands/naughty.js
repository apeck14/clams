const { clanWarStats, getMembers, tag, hex, logo } = require("../util/clanUtil");
const { LUFooter } = require("../util/lastUpdatedUtil");
const mongoUtil = require("../util/mongoUtil");
const { parseDate } = require("../util/otherUtil");

module.exports = {
    name: 'naughty',
    adminCommand: true,
    execute: async (message) => {
        const db = await mongoUtil.db('Clan');
        const collection = db.collection('Matches');

        const members = await getMembers(tag, true);
        const matchesByMemberPromises = members.map(m => collection.find({tag: m}).toArray());
        const matchesByMember = (await Promise.all(matchesByMemberPromises)).filter(p => p.length > 0);

        const memberStats = (await clanWarStats()).reverse();
        const lessThan40Percent = memberStats.filter(p => p.wins / (p.wins + p.losses) < 0.4);
        const noTuesdayAMMatches = [];
        
        //find players with no Tuesday AM war matches
        for(const member of matchesByMember){
            let tuesdayWarMatch = false;

            for(const m of member){
                const date = parseDate(m.battleTime);

                if(date.getUTCDay() === 2 && m.isRaceMatch === true) {
                    tuesdayWarMatch = true;
                    break;
                }
            }

            if(!tuesdayWarMatch) noTuesdayAMMatches.push(member[member.length-1].name);
        }

        //sort alphabetically
        noTuesdayAMMatches.sort((a, b) => a.localeCompare(b));
        
        const desc = () => {
            let desc = '';

            if(noTuesdayAMMatches.length > 0) desc += `**__No Tuesday Race Matches__**${noTuesdayAMMatches.map(p => `\n• **${p}**`).join('')}`;
            if(lessThan40Percent.length > 0) desc += `\n\n**__Below 40% W/L__**${lessThan40Percent.map(p => `\n• **${p.name}**: ${(p.wins/(p.wins+p.losses)*100).toFixed()}% (${p.wins}-${p.losses})`).join('')}`;

            return desc;
        }

        const naughtyEmbed = {
            color: hex,
            thumbnail: {
                url: logo
            },
            title: `Rowdy's Naughty Lists :thinking:`,
            description: desc(),
            footer: {
                text: LUFooter()
            }
        }

        message.channel.send({ embed: naughtyEmbed });
    }
}