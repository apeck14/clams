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

                if(m.type === 'boat') player.attacksLeft -= 1;
                else if(m.type === 'battle'){
                    player.attacksLeft -= 1;
                    (m.won) ? attacksUsed.totalWins++ : attacksUsed.totalLosses++;
                }
                else if(m.type === 'duel'){
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
    },
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
                rating: await clanUtil.playerRating([tag]),
                pb: player.bestTrophies,
                cards: player.cards,
                warWins: player.warDayWins,
                mostChallWins: player.challengeMaxWins,
                challWins: classicChallWins,
                grandChallWins: grandChallWins
            }

        } catch (e) {
            console.log(e);
            return false;
        }
    },
    playerRating: async tags => {
        if(!Array.isArray(tags)) return;

        const cardWeight = 0.3;
        const trophyWeight = 0.45;
        const challWeight = 0.25;

        const cardRating = player => {
            //sort cards by lvl
            const cards = player.cards.sort((a,b) => {
                const aDiff = a.maxLevel - a.level;
                const bDiff = b.maxLevel - b.level;
    
                return aDiff - bDiff;
            });
    
            const iterations = cards.length < 102 ? cards.length : 102;
            let rating = 0;
    
            for(let i = 0; i < iterations; i++){
                const diff = cards[i].maxLevel - cards[i].level;
                if(diff === 0) rating += 1;
                else if(diff === 1) rating += 0.5;
                else if(diff === 2) rating += 0.2;
                else if(diff === 3) rating += 0.08;
            }            
    
            rating = rating / iterations * 100;

            return rating > 99 ? 99 : rating;
        };
        const trophyRating = player => {
            const bestTrophies = player.bestTrophies;
    
            if(bestTrophies < 4000) return 0;
            else if(bestTrophies < 4500) return 10;
            else if(bestTrophies < 5000) return 25;
            else if(bestTrophies <= 5100) return 35;
            else if(bestTrophies <= 5200) return 40;
            else if(bestTrophies <= 5300) return 45;
            else if(bestTrophies <= 5400) return 50;
            else if(bestTrophies <= 5500) return 55;
            else if(bestTrophies <= 5600) return 60;
            else if(bestTrophies <= 5700) return 63;
            else if(bestTrophies <= 5800) return 65;
    
            else if(bestTrophies <= 5820) return 66;
            else if(bestTrophies <= 5840) return 67;
            else if(bestTrophies <= 5860) return 68;
            else if(bestTrophies <= 5880) return 69;
            else if(bestTrophies <= 5900) return 70;
    
            else if(bestTrophies <= 5920) return 71;
            else if(bestTrophies <= 5940) return 72;
            else if(bestTrophies <= 5960) return 73;
            else if(bestTrophies <= 5980) return 74;
            else if(bestTrophies <= 6000) return 75;
    
            else if(bestTrophies <= 6033) return 76;
            else if(bestTrophies <= 6066) return 77;
            else if(bestTrophies <= 6100) return 78;
    
            else if(bestTrophies <= 6133) return 79;
            else if(bestTrophies <= 6166) return 80;
            else if(bestTrophies <= 6200) return 81;
    
            else if(bestTrophies <= 6225) return 82;
            else if(bestTrophies <= 6250) return 83;
            else if(bestTrophies <= 6275) return 84;
            else if(bestTrophies <= 6300) return 85;
    
            else if(bestTrophies <= 6350) return 86;
            else if(bestTrophies <= 6400) return 87;
    
            else if(bestTrophies <= 6450) return 88;
            else if(bestTrophies <= 6500) return 89;
    
            else if(bestTrophies <= 6550) return 90;
            else if(bestTrophies <= 6600) return 91;
    
            else if(bestTrophies <= 6650) return 92;
            else if(bestTrophies <= 6700) return 93;
    
            else if(bestTrophies <= 6750) return 94;
            else if(bestTrophies <= 6800) return 95;
    
            else if(bestTrophies <= 6850) return 96;
            else if(bestTrophies <= 6900) return 97;
    
            else if(bestTrophies < 7000) return 98;
    
            else return 99;
        };
        const challRating = player => {
            const maxWins = player.challengeMaxWins;
            if(maxWins === 0) return 0;
            
            let rating = 0;

            for(let i = 1; i < maxWins + 1; i++){
                if(i < 6) rating += 5;
                else if(i < 10) rating += 7;
                else if(i < 13) rating += 10;
                else if(i < 17) rating += 3;
                else if(i === 17) rating += 2;
                else rating++;
            }
    
            return rating - 1;
        };
        const achievements = player => {
            const warWins = player.warDayWins;
            const badges = player.badges;
            let rating = 0;
    
            //war wins
            if(warWins <= 25) rating -= 5;
            else if(warWins <= 50) rating -= 3;
            else if(warWins >= 300) rating += 5;
            else if(warWins >= 250) rating += 3;
            else if(warWins >= 200) rating += 1;
    
            //badges
            for(const b of badges){
                if(b.name === "Classic12Wins"){ // Classic Chall
                    if(b.progress >= 100) rating += 20;
                    else if(b.progress >= 50) rating += 10;
                    else if(b.progress >= 10) rating += 5;
                    else if(b.progress >= 5) rating += 3;
                    else if(b.progress === 1) rating += 2;
                }
                else if(b.name === "Grand12Wins"){ // Grand Chall
                    if(b.progress >= 100) rating += 100;
                    else if(b.progress >= 50) rating += 50;
                    else if(b.progress >= 10) rating += 25;
                    else if(b.progress >= 5) rating += 15;
                    else if(b.progress === 1) rating += 7;
                }
                else if(b.name.indexOf("Crl") !== -1){ //CRL
                    if(b.progress === 20) rating += 10;
                    else if(b.progress >= 18) rating += 7;
                    else rating += 6;
                }
                else if(b.name.indexOf("Ladder") !== -1){ //Tournaments and Ladder Finishes
                    if(b.progress <= 10) rating += 25;
                    else if(b.progress <= 100) rating += 15;
                    else if(b.progress <= 500) rating += 7;
                    else rating += 5;
                }
            }
    
            return rating;
        };

        const playerPromises = tags.map(p => request(`https://proxy.royaleapi.dev/v1/players/%23${p[0] === '#' ? p.substr(1) : p}`));
        const players = await Promise.all(playerPromises);
        let ratings = players.map(p => (cardRating(p) * cardWeight) + (trophyRating(p) * trophyWeight) + (challRating(p) * challWeight) + achievements(p));
        ratings = ratings.map(p => p > 99 ? 99 : p);

        ratings.sort();

        return ratings.length === 1 ? ratings[0] : ratings;
    },
    clanWarStats: async () => {
        const db = await mongoUtil.db('Clan');
        const collection = db.collection('Matches');

        const members = await clanUtil.getMembers(clanUtil.tag, true);
        const matchesByMemberPromises = members.map(m => collection.find({tag: m}).toArray());
        const matchesByMember = await Promise.all(matchesByMemberPromises);

        const memberStats = [];

        for(const member of matchesByMember){
            let wins = 0;
            let losses = 0;

            for(const m of member){
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
        });

        return memberStats;
    }
}

module.exports = clanUtil;