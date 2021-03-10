const axios = require('axios');
const { MessageEmbed } = require('discord.js');
const { groupBy } = require("lodash");

exports.clan = {
    name: "Clash of Clams",
    tag: "V2GQU",
    logo: "https://cdn.royaleapi.com/static/img/badge/legendary-1/A_Char_Goblin_01.png?t=df40fd13c"
}
exports.serverEmojis = [
    {"name": "cwtrophy", "input": "<:cwtrophy:816373519872950282>"},
    {"name": "fame", "input": "<:fame:816373547203035147>"},
    {"name": "swords", "input": "<:swords:816373565523623987>"}
];
exports.hex = "#8ad67d";
exports.designatedChannelID = "816334813962960926";
exports.missedAttacksChannelID = "816435861033582642";
exports.applyChannelID = "796185828366876702";
exports.applyLogChannelID = "816435969070202950";
exports.clanLogChannelID = "816436105779085366";
exports.privateChannelID = "816445569777139712";
exports.lastUpdated = new Date();

const parseDate = date => {
    try{
        return new Date(Date.UTC(
            date.substr(0, 4),
            date.substr(4, 2) - 1,
            date.substr(6, 2),
            date.substr(9, 2),
            date.substr(11, 2),
            date.substr(13, 2),
        ));
    } catch(e) {
        console.log(`Error (parseDate): ${date}`);
    }
};
const isWinner = (team, opp, type, matches) => {

    if(type === "riverRacePvP"){
        if(opp < team) return true;
        else if(team < opp) return false;
    }
    else if(type === "CW_Duel_1v1"){
        if(matches === 2){
            if(team > opp) return true;
            else return false;
        }
        else if(matches === 3){
            if(team < 2) return false;
            else if(opp  < 2) return true;
            else if(Math.abs(team - opp) <= 1) return "N/A";
            else if(team > opp) return true;
            else return false;
        }
    }
};
const mostRecentTenOClock = () => {
    const date = new Date;
    if (date.getUTCHours() < 10) {
        date.setUTCDate(date.getUTCDate() - 1);
    }
    date.setUTCHours(10, 0, 0, 0);
    return date;
};
const isBetweenDates = (date, startDate, endDate) => {
    date = parseDate(date);
    startDate = parseDate(startDate);
    endDate = parseDate(endDate);

    return date >= startDate && date <= endDate;
};
const median = arr => {
    if(!Array.isArray(arr)) return;

    if(arr.length % 2 === 0){
        return Math.round((arr[arr.length / 2] + arr[arr.length / 2 - 1]) / 2);
    }
    else{
        return arr[Math.floor(arr.length / 2)]
    }
};

exports.setLastUpdated = date => {
    exports.lastUpdated = date;
};
exports.isRaceDay = async token => {
    const rr = await axios.get(`https://proxy.royaleapi.dev/v1/clans/%23${exports.clan.tag}/currentriverrace`, { headers : { 'Authorization': 'Bearer ' + token } }).catch(e => {console.log(e.response)});
    
    if(!rr){
        console.log("Empty request. (isRaceDay)");
        return false;
    }
    //if race is active
    else return (!rr.data.clan.finishTime) ? true : false;
};
exports.isFinalWeek = async token => {
    const res = await axios.get(`https://proxy.royaleapi.dev/v1/clans/%23${exports.clan.tag}/riverracelog`, { headers : { 'Authorization': 'Bearer ' + token } }).catch(e => {console.log(e.response)});

    if(!res){
        console.log("Empty request. (isFinalWeek)");
        return false;
    }
    //if final week
    else return (res.data.items[0].sectionIndex === 2) ? true : false;
};
exports.isGlitchTime = () => {
    const now = new Date();

    //if monday
    if(now.getUTCDay() === 1){
        //if between 9:30 AM UTC and 9:59 AM UTC
        if(now.getUTCHours() === 9 && now.getUTCMinutes() >= 30) return true;
        else return false;
    }
    return false;
};
exports.getMinsDiff = (a, b) => {
    if(!b){
        if(typeof a === "string" && a.indexOf(".000Z") >= 0) a = parseDate(a);
        const diff = Math.abs(new Date() - a);
        const mins = Math.ceil((diff/1000)/60);
        return mins;
    }
    else{
        let start = parseDate(a);
        let finish = parseDate(b);

        const diff = Math.abs(start - finish);
        const mins = Math.floor((diff/1000)/60);
        return mins;
    }
};
exports.getMembers = async (tag, token) => {

    const res = await axios.get(`https://proxy.royaleapi.dev/v1/clans/%23${(tag[0] === "#") ? tag.substr(1) : tag}/members`, { headers : { 'Authorization': 'Bearer ' + token } }).catch(e => console.log(e.response));

    if(res){
        return res.data.items.map(p => ({ tag: p.tag, name: p.name }));
    }

    return [];
};
exports.isWithinWarDay = date => {
    return parseDate(date) > mostRecentTenOClock();
};
exports.sortArrByDate = (arr, timeVal) => {
    arr.sort((a, b) => {

        let da = parseDate(a[timeVal]);
        let db = parseDate(b[timeVal]);
        
        return da - db;
    });
    return arr;
};
exports.updateWarMatches = async (members, collection, token, raceDay, startTime, finishTime) => {
    for(const p of members){
        const log = await axios.get(`https://proxy.royaleapi.dev/v1/players/%23${p.tag.substr(1)}/battlelog`, { headers : { 'Authorization': 'Bearer ' + token } }).catch(e => {console.log(e.reponse)});
    
        if(log){
            for(const m of log.data){
                if(m.type !== "riverRacePvP" && (m.type !== "boatBattle" && m.boatBattleSide !== "attacker") && m.gameMode.name !== "CW_Duel_1v1") continue;
                else if(!exports.isWithinWarDay(m.battleTime)) continue;

                const matchExists = await collection.findOne({"tag": m.team[0].tag, "battleTime": m.battleTime});

                //if not yet in DB
                if(!matchExists){
                    const raceMatches = await collection.find({"tag": m.team[0].tag, "raceDay": true}).toArray();

                    //if already 100 matches, remove oldest
                    if(raceMatches.length === 100){
                        exports.sortArrByDate(raceMatches, 'battleTime');
                        collection.deleteOne(raceMatches[0]);
                    }

                    let type, win, crowns, enemyCrowns;
                    let matches = m.team[0].cards.length / 8;

                    //set type
                    if(m.type === "riverRacePvP"){
                        type = "War";
                        crowns = m.team[0].crowns;
                        enemyCrowns = m.opponent[0].crowns;
                        win = isWinner(crowns, enemyCrowns, m.type, matches);
                    }
                    else if(m.gameMode.name === "CW_Duel_1v1"){
                        type = "Duel";
                        crowns = m.team[0].crowns;
                        enemyCrowns = m.opponent[0].crowns;
                        win = isWinner(crowns, enemyCrowns, m.gameMode.name, matches);
                    }
                    else if(m.type === "boatBattle"){
                        type = "Boat Battle";
                        crowns = m.team[0].crowns;
                        enemyCrowns = null;
                        win = m.boatBattleWon;
                        matches = 1;
                    }

                    //set raceDay
                    if(raceDay === false){
                        if(isBetweenDates(m.battleTime, startTime, finishTime)) raceDay = true;
                    }

                    const match = {
                        tag: m.team[0].tag,
                        name: m.team[0].name,
                        clan: m.team[0].clan.tag,
                        type: type,
                        battleTime: m.battleTime,
                        won: win,
                        crowns: crowns,
                        enemyCrowns: enemyCrowns,
                        matchCount: matches,
                        raceDay: raceDay
                    };
                
                    collection.insertOne(match);
                }
            }
        }
    }
};

exports.createLBEmbed = async (members, mdbClient) => {
    const collection = mdbClient.db("Clan").collection("Matches");
    let embed = exports.addLUFooter(new MessageEmbed().setTitle('__Clams War Leaderboard__').setThumbnail(exports.clan.logo).setColor(exports.hex));
    let winPercentages = [];
    let top10 = "";
    let clanWins = 0;
    let clanLosses = 0;

    const results = await collection.find({"tag": {$in: members.map(mem => mem.tag)}, "raceDay": true, "won": {$ne: "N/A"}}).toArray();
    members = groupBy(results, mem => mem.tag);

    for(const mem in members){
        let name = "";
        let wins = 0;
        let losses = 0;

        for(const m of members[mem]){
            name = m.name;
            if(m.type === "War") (m.won) ? wins++ : losses++;
            else if(m.type === "Duel"){
                if(m.won){
                    if(m.matchCount === 3) losses++;
                    wins += 2;
                }
                else{
                    if(m.matchCount === 3) wins++;
                    losses += 2;
                }
            }
        }

        if(wins + losses >= 4){
            winPercentages.push({"name": name, "percent": ((wins / (wins+losses)) * 100).toFixed(0), "wins": wins, "losses": losses});
            clanWins += wins;
            clanLosses += losses;
        }
    }

    //sort by win percentage, lowest to greatest. ties result to whoever has more matches played
    winPercentages.sort((a, b) => {
        if(a.percent === b.percent){
            if(a.wins + a.losses === b.wins + b.losses) return winPercentages.indexOf(a) - winPercentages.indexOf(b);
            return (b.wins + b.losses) - (a.wins + a.losses);
        }
        return b.percent - a.percent;
    });

    //add top 10
    for(let i = 0; i < 10; i++){
        let p = winPercentages[i];
        if(i === 0) top10 += `\n:first_place: **${p.name}**: ${p.percent}% (${p.wins}-${p.losses})`;
        else if(i === 1) top10 += `\n:second_place: **${p.name}**: ${p.percent}% (${p.wins}-${p.losses})`;
        else if(i === 2) top10 += `\n:third_place: **${p.name}**: ${p.percent}% (${p.wins}-${p.losses})`;
        else top10 += `\n**${i+1}**.  **${p.name}**: ${p.percent}% (${p.wins}-${p.losses})`;
    }

    return embed.setDescription(`**Total**: ${(clanWins/(clanLosses+clanWins) * 100).toFixed(1)}% (${clanWins}-${clanLosses})\n\n**__Top Players__**${top10}`);
};
exports.createStatsEmbed = async (tag, collection) => {
    let embed = new MessageEmbed().setColor(exports.hex);
    const results = await collection.find({"tag": tag, "raceDay": true, "won": {$ne:"N/A"}}).toArray();

    if(results.length === 0) return embed.setDescription("No data on this player has been logged yet.");

    let name = results[results.length - 1].name;
    let warWins = 0;
    let warLosses = 0;
    let duelWins = 0;
    let duelLosses = 0;
    let totalDuelWins = 0;
    let totalDuelLosses = 0;
    let warCrowns = 0;
    let duelCrowns = 0;
    let warCrownsAllowed = 0;
    let duelCrownsAllowed = 0;
    
    for(const m of results){
        if(m.type === "War"){
            if(m.won) warWins++;
            else warLosses++;
            warCrowns += m.crowns;
            warCrownsAllowed += m.enemyCrowns;
        }
        else if(m.type === "Duel"){
            if(m.won){
                if(m.matchCount === 3) totalDuelLosses++;
                totalDuelWins += 2;
                duelWins++;
            }
            else if(!m.won){
                if(m.matchCount === 3) totalDuelWins++;
                totalDuelLosses += 2;
                duelLosses++;
            }

            duelCrowns += m.crowns;
            duelCrownsAllowed += m.enemyCrowns;
        }
    }

    let wins = warWins + duelWins;
    let totalWins = warWins + totalDuelWins;
    let losses = warLosses + duelLosses;
    let totalLosses = warLosses + totalDuelLosses;
    let warMatches = warWins + warLosses;
    let duelMatches = duelWins + duelLosses;
    let totalDuelMatches = totalDuelWins + totalDuelLosses;
    let matches = wins + losses;
    let totalMatches = totalWins + totalLosses;

    let winPercentage = (wins/matches * 100).toFixed(0);
    let totalWinPercentage = (totalWins/totalMatches * 100).toFixed(0);
    let warWinPercentage = (warWins/warMatches * 100).toFixed(0);
    let warAvgCrowns = (warCrowns/warMatches).toFixed(1);
    let warAvgCrownsAllowed = (warCrownsAllowed/warMatches).toFixed(1);
    let duelWinPercentage = (duelWins/duelMatches * 100).toFixed(0);
    let totalDuelWinPercentage = (totalDuelWins/totalDuelMatches * 100).toFixed(0);
    let duelAvgCrowns = (duelCrowns/duelMatches).toFixed(1);
    let duelAvgCrownsAllowed = (duelCrownsAllowed/duelMatches).toFixed(1);
    let duelAvgMatches = (totalDuelMatches/duelMatches).toFixed(1);

    if(warMatches === 0){
        warWinPercentage = 0;
        warAvgCrowns = (0).toFixed(1);
        warAvgCrownsAllowed = (0).toFixed(1);
    }
    else if(duelMatches === 0){
        duelWinPercentage = 0;
        totalDuelWinPercentage = 0;
        duelAvgCrowns = (0).toFixed(1);
        duelAvgCrownsAllowed = (0).toFixed(1);
        duelAvgMatches = (0).toFixed(1);
    }

    embed = exports.addLUFooter(embed);

    return embed.setThumbnail(exports.clan.logo).setTitle(`__${name}'s War Stats__`).setDescription(`**Wins**: __${totalWins}__ (${wins})\n**Losses**: __${totalLosses}__ (${losses})\n**Win %**: __${totalWinPercentage}%__ (${winPercentage}%)\n\n**__Battles__**\nWins: **${warWins}**\nLosses: **${warLosses}**\nWin %: **${warWinPercentage}%**\nAvg. Crowns: **${warAvgCrowns}**\nAvg. Crowns Allowed: **${warAvgCrownsAllowed}**\n\n**__Duels__**\nWins: **__${totalDuelWins}__** (${duelWins})\nLosses: **__${totalDuelLosses}__** (${duelLosses})\nWin %: **__${totalDuelWinPercentage}%__** (${duelWinPercentage}%)\nAvg. Matches: **${duelAvgMatches}**\nAvg. Crowns: **${duelAvgCrowns}**\nAvg. Crowns Allowed: **${duelAvgCrownsAllowed}**`);
};
exports.createAttacksEmbed = async (embed, members, mdbClient) => {
    let collection = mdbClient.db("Clan").collection("Matches");
    let unusedAtks = [];
    let fourAttacks = "";
    let threeAttacks = "";
    let twoAttacks = "";
    let oneAttack = "";
    let newPlayers = "";
    let totalAttacksLeft = 0;
    let desc = "";
    
    const results = await collection.find({"tag": {$in: members.map(mem => mem.tag)}}).toArray();
    const membersMatches = groupBy(results, mem => mem.tag);

    //count all members attacks
    for(const mem of members){
        let count = 0;

        //if theres matches of for this player
        if(membersMatches[mem.tag]){
            for(const m of membersMatches[mem.tag]) {
                if(exports.isWithinWarDay(m.battleTime)){
                    count += m.matchCount;
                }
            }
    
            if(count < 4){
                let attacksLeft = 4 - count;
                totalAttacksLeft += attacksLeft;
                unusedAtks.push({"name": mem.name, "attacksLeft": attacksLeft});
            }
        }
        else newPlayers += `\n• **${mem.name}**`; //if new member (no matches logged yet)
    }

    if(unusedAtks.length === 0) return embed.setDescription(`All attacks have been used!`).setThumbnail();
    
    //sort unusedAtks alphabetically
    unusedAtks.sort((a, b) => {
        let fa = a.name.toLowerCase();
        let fb = b.name.toLowerCase();

        if (fa < fb) {
            return -1;
        }
        if (fa > fb) {
            return 1;
        }
        return 0;
    });

    //update desc
    for(const mem of unusedAtks){
        if(mem.attacksLeft === 4) fourAttacks += `\n• **${mem.name}**`;
        else if(mem.attacksLeft === 3) threeAttacks += `\n• **${mem.name}**`;
        else if(mem.attacksLeft === 2) twoAttacks += `\n• **${mem.name}**`;
        else if(mem.attacksLeft === 1) oneAttack += `\n• **${mem.name}**`;
    }
    
    if(fourAttacks !== "") desc += `\n\n**__4 Attacks Left__**${fourAttacks}`;
    if(threeAttacks !== "") desc += `\n\n**__3 Attacks Left__**${threeAttacks}`;
    if(twoAttacks !== "") desc += `\n\n**__2 Attacks Left__**${twoAttacks}`;
    if(oneAttack !== "") desc += `\n\n**__1 Attack Left__**${oneAttack}`;
    if(newPlayers !== "") desc += `\n\n**__No Data__**${newPlayers}`;

    //add last updated footer
    embed = exports.addLUFooter(embed);

    return embed.setTitle(`__Remaining War Attacks__`).setDescription(`Total Attacks Left: **${totalAttacksLeft}**\nTotal Members: **${unusedAtks.length}**${desc}`);

};
exports.addLUFooter = embed => {
    return embed.setFooter(`Matches Last Updated: ${exports.getMinsDiff(exports.lastUpdated)} min(s) ago | ?FAQ`);
};

exports.playerRating = async (tag, API_KEY) => {
    /* 
    ----- WEIGHTS -----
    - Cards (40%)
    - Best Trophies (30%)
    - Max Chall. Wins (30%)

    War Day Wins:
        - <= 50: -3
        - >= 200: +1
        - >= 250: +3
        - >= 300: +5

    Badges:
        - 1x Chall. Win: +2
        - 5x Chall. Win: +3
        - 10x Chall. Win: +5
        - 50x Chall. Win: +10
        - 100x Chall. Win: +20

        - 1x Grand Chall. Win: +5
        - 5x Grand Chall. Win: +10
        - 10x Grand Chall. Win: +25
        - 50x Grand Chall. Win: +50
        - 100x Grand Chall. Win: +100

        - Clash Royale League Badge <= 17: +6
        - Clash Royale League Badge <= 18: +8
        - Clash Royale League Badge === 20: +10

        - Tournament Finish Top 1000: +5
        - Tournament Finish Top 500: +7
        - Tournament Finish Top 100: +15
        - Tournament Finish Top 10: +25
    */
    const cardWeight = 0.4;
    const trophyWeight = 0.3;
    const challWeight = 0.3;
    const cardRating = player => {
        //sort cars by lvl
        const cards = player.data.cards.sort((a,b) => {
            const aDiff = a.maxLevel - a.level;
            const bDiff = b.maxLevel - b.level;

            return aDiff - bDiff;
        });
                    
        let rating = 0;

        const iterations = cards.length < 80 ? cards.length : 80;

        for(let i = 0; i < iterations; i++){
            const diff = cards[i].maxLevel - cards[i].level;
            if(diff === 0) rating += 1;
            else if(diff === 1) rating += 0.5;
            else if(diff === 2) rating += 0.2;
            else if(diff === 3) rating += 0.08;
        }            

        return (rating / iterations * 100) - 1;
    };
    const trophyRating = player => {
        const bestTrophies = player.data.bestTrophies;

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
        const maxWins = player.data.challengeMaxWins;
        let rating = 0;

        if(maxWins === 0) return 0;

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
        const warWins = player.data.warDayWins;
        const badges = player.data.badges;
        let rating = 0;

        //war wins
        if(warWins <= 50) rating -= 3;
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

    //if array of players is passed
    if(Array.isArray(tag)){
        let players = tag.map(p => axios.get(`https://proxy.royaleapi.dev/v1/players/%23${p.substr(1)}`, { headers : { 'Authorization': 'Bearer ' + API_KEY.token(true) } }));
        players = await Promise.all(players);
        let ratings = players.map(p => (cardRating(p) * cardWeight) + (trophyRating(p) * trophyWeight) + (challRating(p) * challWeight) + achievements(p));
        ratings = ratings.map(p => p > 99 ? 99 : p);

        ratings.sort();

        return median(ratings);
    }

    //if individual player
    const player = await axios.get(`https://proxy.royaleapi.dev/v1/players/%23${tag.substr(1)}`, { headers : { 'Authorization': 'Bearer ' + API_KEY.token() } }).catch(e => {console.log(e.reponse)});

    if(player){
        const name = player.data.name;
        const id = player.data.tag;

        const cardRatingINT = cardRating(player);
        const trophyRatingINT = trophyRating(player);
        const challRatingINT = challRating(player);
        const achievementsINT = achievements(player);
        let rating = Math.round((cardRatingINT * cardWeight) + (trophyRatingINT * trophyWeight) + (challRatingINT * challWeight)) + achievementsINT;

        if(rating > 99) rating =  99;

        return {
            "rating": rating,
            "tag": id,
            "name": name,
            "Cards (40%)": Math.round(cardRatingINT),
            "Best Trophies (30%)": trophyRatingINT,
            "Max Chall. Wins (30%)": challRatingINT,
            "Achievements (+)": achievementsINT
        };
    }
};