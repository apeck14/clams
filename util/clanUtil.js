const { request } = require('./otherUtil');
const mongoUtil = require('./mongoUtil');

const clanUtil = {
    name: "Clash of Clams",
    tag: "V2GQU",
    logo: "https://cdn.royaleapi.com/static/img/badge/legendary-1/A_Char_Goblin_01.png?t=df40fd13c",
    hex: "#8ad67d",
    /**
     * Get array of members from a clan
     * @param {String} tag - clan tag
     * @param {*} tagsOnly - return array of player tags only
     * @param {*} namesOnly - return array of player names only
     * @returns {Array} - array of player tags/names of members
     */
    getMembers: async (tag = clanUtil.tag, tagsOnly = false, namesOnly = false) => {
        try {
            tag = (tag[0] === `#`) ? tag.substr(1) : tag;
            const mem = await request(`https://proxy.royaleapi.dev/v1/clans/%23${tag}/members`);
    
            //only player tags
            if(tagsOnly === true && namesOnly === false) return mem.items.map(p => p.tag);
            //only player names
            else if(namesOnly === true && tagsOnly === false) return mem.items.map(p => p.name);
            //both names and tags
            return mem.items.map(p => ({ tag: p.tag, name: p.name }));
        } catch(e) {
            if(e.response) console.error(e.response)
            else console.error(e);
            return [];
        }
    },
    /**
     * Get basic data of any player
     * @param {String} tag - Clash Royale tag of player
     * @returns {Object} - Info about player (name, tag, clan, level, cards, warWins, etc)
     */
    getPlayerData: async tag => {
        try{
            tag = tag[0] === "#" ? tag.substr(1) : tag;
            const player = await request(`https://proxy.royaleapi.dev/v1/players/%23${tag}`);

            const classicChallBadge = player.badges.filter(b => b.name === "Classic12Wins");
            const grandChallBadge = player.badges.filter(b => b.name === "Grand12Wins");
            const classicChallWins = classicChallBadge.length === 1 ? classicChallBadge[0].progress : 0;
            const grandChallWins = grandChallBadge.length === 1 ? grandChallBadge[0].progress : 0;

            return {
                name: player.name,
                tag: player.tag,
                clan: player.clan ? player.clan.name : 'None',
                level: player.expLevel,
                pb: player.bestTrophies,
                cards: player.cards,
                warWins: player.warDayWins,
                mostChallWins: player.challengeMaxWins,
                challWins: classicChallWins,
                grandChallWins: grandChallWins
            }

        } catch (e) {
            return false;
        }
    }
}

module.exports = clanUtil;