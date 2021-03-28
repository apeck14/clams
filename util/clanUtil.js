const { request, isWinner, mostRecentWarReset, parseDate, isBetweenDates } = require('./otherUtil');
const mongoUtil = require('./mongoUtil');

const clanUtil = {
    name: "Clash of Clams",
    tag: "V2GQU",
    logo: "https://cdn.royaleapi.com/static/img/badge/legendary-1/A_Char_Goblin_01.png?t=df40fd13c",
    hex: "#8ad67d",
    warWeeks: 5, //change monthly depending on amount of weeks
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
    isColosseumWeek: async () => {
        try{
            const log = await request(`https://proxy.royaleapi.dev/v1/clans/%23${clanUtil.tag}/riverracelog`);
            return log.items[0].sectionIndex === clanUtil.warWeeks - 2;
        } catch(e) {
            if(e.response) console.error(e.response)
            else console.error(e);
            return false;
        }
    },
    isRaceDay: async () => {
        try {
            const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${clanUtil.tag}/currentriverrace`);
            return !rr.clan.finishTime;
        } catch (e) {
            if(e.response) console.error(e.response);
            else console.error(e);
            return false;
        }
    },
    updateWarMatches: async (members, cTag = clanUtil.tag) => {
        cTag = cTag[0] === '#' ? cTag.substr(1) : cTag;
        const isOurClan = cTag === clanUtil.tag;

        const db = await mongoUtil.db("Clan");
        const collection = isOurClan ? db.collection("Matches") : db.collection("Opp Matches");

        const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${cTag}/currentriverrace`);
        const log = await request(`https://proxy.royaleapi.dev/v1/clans/%23${cTag}/riverracelog`);

        for(const p of members){
            const battleLog = await request(`https://proxy.royaleapi.dev/v1/players/%23${p.tag.substr(1)}/battlelog`, true);
            
            //loop through player's recent matches
            for(const b of battleLog){
                try{
                    if(b.type !== 'riverRacePvP' && b.type !== 'riverRaceDuel' && b.type !== 'boatBattle') continue; //non war match
                    else if(b.type === 'boatBattle' && b.boatBattleSide === 'defender') continue; //defensive boat battle
    
                    const matchExists = await collection.findOne({"tag": b.team[0].tag, "battleTime": b.battleTime});
    
                    if(!matchExists) {
                        const clanTag = b.team[0].clan.tag;
                        if(clanTag !== "#"+cTag) continue; //continue if not clan match

                        const crowns = b.team[0].crowns;
                        const oppCrowns = b.opponent[0].crowns;

                        const battleTimeDateObj = parseDate(b.battleTime);
                        const mostRecentReset = mostRecentWarReset();
                        
                        const type = () => {
                            if(b.type === "boatBattle") return "boat";
                            if(b.type === "riverRacePvP") return "battle";
                            if(b.type === "riverRaceDuel") return "duel";
                        };
                        const isRaceMatch = () => {
                            //race is active and match is after reset
                            if(!rr.clan.finishTime && (battleTimeDateObj >= mostRecentReset)) return true;
                            //race is finished but match fell in between race start and finish
                            if(rr.clan.finishTime && isBetweenDates(b.battleTime, mostRecentReset, rr.clan.finishTime)) return true;
                            return false;
                        };
                        const isColosseumMatch = () => {
                            const weekIndex = log.items[0].sectionIndex;
                            const isColWeek = weekIndex === clanUtil.warWeeks - 2;
    
                            //if colosseum week and match started after last reset
                            if(isColWeek && (battleTimeDateObj >= mostRecentReset)) return true;
                            //if not colosseum week anymore but match fell within last week
                            if(!isColWeek && weekIndex === 0 && (battleTimeDateObj <= mostRecentReset && battleTimeDateObj >= mostRecentReset.setUTCDate(mostRecentReset.getUTCDate() - 7))) return true;
                            return false;
                        };
    
                        let match;
    
                        if(type() === "boat"){
                            match = {
                                name: b.team[0].name,
                                tag: b.team[0].tag,
                                clanTag: clanTag,
                                type: 'boat',
                                battleTime: b.battleTime,
                                won: b.boatBattleWon,
                                isRaceMatch: isRaceMatch(),
                                isColosseumMatch: isColosseumMatch()
                            }
                        }
                        else if(type() === "battle"){
                            match = {
                                name: b.team[0].name,
                                tag: b.team[0].tag,
                                clanTag: clanTag,
                                type: 'battle',
                                battleTime: b.battleTime,
                                won: crowns > oppCrowns,
                                crowns: crowns,
                                oppCrowns: oppCrowns,
                                isRaceMatch: isRaceMatch(),
                                isColosseumMatch: isColosseumMatch()
                            }
                        }
                        else{ //duel
                            match = {
                                name: b.team[0].name,
                                tag: b.team[0].tag,
                                clanTag: clanTag,
                                type: 'duel',
                                battleTime: b.battleTime,
                                won: isWinner(crowns, oppCrowns, b.team[0].cards.length / 8),
                                crowns: crowns,
                                oppCrowns: oppCrowns,
                                matchCount: b.team[0].cards.length / 8,
                                isRaceMatch: isRaceMatch(),
                                isColosseumMatch: isColosseumMatch()
                            }
                        }
    
                        collection.insertOne(match);
                        console.log(match);
                    }
                } catch (e){
                    console.dir(b);
                    console.error(e);
                }
            }
        }
    },
    getAttacksLeft: async (startTime = mostRecentWarReset(), endTime = new Date(), clanTag = clanUtil.tag) => {
        try{
            if(typeof startTime === 'string') startTime = parseDate(startTime);
            if(typeof endTime === 'string') startTime = parseDate(endTime);

            const db = await mongoUtil.db("Clan");
            const collection = clanTag === clanUtil.tag ? db.collection('Matches') : db.collection('Opp Matches');

            const members = await clanUtil.getMembers(clanTag);
            const matches = await collection.find({tag: { $in: members.map(m => m.tag) }}).toArray();

            const attacksUsed = {
                totalWins: 0,
                totalLosses: 0,
                remainingAttacks: members.map(m => ({name: m.name, tag: m.tag, attacksLeft: 4}))
            };
            
            //loop through all matches in DB
            for(const m of matches){
                if(!isBetweenDates(m.battleTime, startTime, endTime)) continue;

                const player = attacksUsed.remainingAttacks.find(p => p.tag === m.tag);

                if(m.type === 'Boat Battle') player.attacksLeft -= 1;
                else if(m.type === 'War'){
                    player.attacksLeft -= 1;
                    (m.won) ? attacksUsed.totalWins++ : attacksUsed.totalLosses++;
                }
                else if(m.type === 'Duel'){
                    player.attacksLeft -= m.matchCount;

                    if(m.matchCount === 2) (m.won) ? attacksUsed.totalWins += 2 : attacksUsed.totalLosses += 2;
                    else{
                        if(m.won === 'N/A'){
                            attacksUsed.totalWins++;
                            attacksUsed.totalLosses++;
                        }
                        else if(m.won){
                            attacksUsed.totalWins += 2;
                            attacksUsed.totalLosses++;
                        }
                        else{
                            attacksUsed.totalWins++;
                            attacksUsed.totalLosses += 2;
                        }
                    }
                }
                
            }

            //check if anyone with 4 attacks is new, if so check their recent matches and see if they have any attacks left
            for(const mem of attacksUsed.remainingAttacks){
                if(mem.attacksLeft === 4){
                    const matchesInDB = await collection.find({tag: mem.tag}).count();
                    
                    if(!matchesInDB){
                        const battleLog = await request(`https://proxy.royaleapi.dev/v1/players/%23${mem.tag.substr(1)}/battlelog`, true);

                        for(const b of battleLog){
                            if(b.type !== 'riverRacePvP' && b.type !== 'riverRaceDuel' && b.type !== 'boatBattle') continue; //non war match
                            else if(b.type === 'boatBattle' && b.boatBattleSide === 'defender') continue; //defensive boat battle
                            else if(!isBetweenDates(b.battleTime, startTime, endTime)) continue;

                            //if war match was done todau, but in a different clan
                            if(b.team[0].clan.tag !== '#'+clanUtil.tag)
                                mem.attacksLeft = 0;
                        }
                    }
                }
            }

            return attacksUsed;
        } catch (e) {
            console.error(e);
            return [];
        }
    }
}

module.exports = clanUtil;