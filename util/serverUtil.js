const { getAttacksLeft, hex, logo } = require("./clanUtil");
const { LUFooter } = require("./lastUpdatedUtil");

const serverUtil = {
    commandsChannelID: "816334813962960926",
    missedAttacksChannelID: "816435861033582642",
    applyChannelID: "796185828366876702",
    appicationsChannelID: "816435969070202950",
    clanLogChannelID: "816436105779085366",
    adminChannelID: "816445569777139712",
    serverEmojis: [
        {"name": "cwtrophy", "input": "<:cwtrophy:816373519872950282>"},
        {"name": "fame", "input": "<:fame:816373547203035147>"},
        {"name": "swords", "input": "<:swords:816373565523623987>"}
    ],
    createAttacksEmbed: async () => {
        const attacksLeftObj = await getAttacksLeft();
        const remainingAttacks = attacksLeftObj.remainingAttacks;

        const winPerc = (attacksLeftObj.totalWins / (attacksLeftObj.totalWins + attacksLeftObj.totalLosses)) * 100;
        const attacksLeft = remainingAttacks.reduce((a, b) => a + b.attacksLeft, 0);
        const membersLeft = remainingAttacks.filter(m => m.attacksLeft > 0).length;

        //sort alphabetically
        attacksLeftObj.remainingAttacks.sort((a, b) => a.name.localeCompare(b.name));

        const fourAttacksLeft = remainingAttacks.filter(m => m.attacksLeft === 4).map(m => `\n• **${m.name}**`).join('');
        const threeAttacksLeft = remainingAttacks.filter(m => m.attacksLeft === 3).map(m => `\n• **${m.name}**`).join('');
        const twoAttacksLeft = remainingAttacks.filter(m => m.attacksLeft === 2).map(m => `\n• **${m.name}**`).join('');
        const oneAttackLeft = remainingAttacks.filter(m => m.attacksLeft === 1).map(m => `\n• **${m.name}**`).join('');

        const desc = () => {
            if(!attacksLeft) return `Today's Win %: **__${winPerc.toFixed(1)}%__**\n\n***No Attacks Remaining***`;

            let desc = `Attacks Left: **${attacksLeft}**\nMembers: **${membersLeft}**\nToday's Win %: **${winPerc.toFixed(1)}%**\n\n`;
            if(fourAttacksLeft) desc += `**__4 Attacks Left__**${fourAttacksLeft}\n\n`;
            if(threeAttacksLeft) desc += `**__3 Attacks Left__**${threeAttacksLeft}\n\n`;
            if(twoAttacksLeft) desc += `**__2 Attacks Left__**${twoAttacksLeft}\n\n`;
            if(oneAttackLeft) desc += `**__1 Attack Left__**${oneAttackLeft}`;

            return desc;
        };

        const attacksEmbed = {
            color: hex,
            title: attacksLeft ? '__Remaining War Attacks__' : null,
            thumbnail: {
                url: logo
            },
            description: desc(),
            footer: {
                text: LUFooter()
            }
        };

        return attacksEmbed;
    }
};

module.exports = serverUtil;