const { request } = require("../util/otherUtil");
const got = require('got');
const cheerio = require('cheerio');
const clanUtil = require("../util/clanUtil");
const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'decks',
    execute: async (message, arg, bot) => {
        arg = (arg[0] === '#') ? arg.substr(1) : arg;

        message.channel.startTyping();

        const player = await request(`https://proxy.royaleapi.dev/v1/players/%23${arg}`);
        if(!player) return message.channel.send(new MessageEmbed().setColor(clanUtil.hex).setDescription('Invalid tag, or unexpected error.'));
        const name = player.name;
        const cards = player.cards.map(c => ({name: c.name.toLowerCase().replace(/ /g, '-'), level: 13 - (c.maxLevel - c.level), png: c.iconUrls.medium}));

        const url = (cardsToInclude) => {
            let url = `https://royaleapi.com/decks/popular?time=14d&sort=win&size=10&players=PvP&min_trophies=5600&max_trophies=10000&min_elixir=1&max_elixir=9&mode=detail&type=Ladder`;
            
            cardsToInclude.forEach(c => url += `&inc=${c}`); //cards to include

            url += '&&global_exclude=false';
            return url;
        }

        const copyURL = (cardsToInclude) => {
            const ids = [
                { name: 'knight', id: 26000000 },
                { name: 'archers', id: 26000001 },
                { name: 'goblins', id: 26000002 },
                { name: 'giant', id: 26000003 },
                { name: 'p.e.k.k.a', id: 26000004 },
                { name: 'minions', id: 26000005 },
                { name: 'balloon', id: 26000006 },
                { name: 'witch', id: 26000007 },
                { name: 'barbarians', id: 26000008 },
                { name: 'golem', id: 26000009 },
                { name: 'skeletons', id: 26000010 },
                { name: 'valkyrie', id: 26000011 },
                { name: 'skeleton-army', id: 26000012 },
                { name: 'bomber', id: 26000013 },
                { name: 'musketeer', id: 26000014 },
                { name: 'baby-dragon', id: 26000015 },
                { name: 'prince', id: 26000016 },
                { name: 'wizard', id: 26000017 },
                { name: 'mini-p.e.k.k.a', id: 26000018 },
                { name: 'spear-goblins', id: 26000019 },
                { name: 'giant-skeleton', id: 26000020 },
                { name: 'hog-rider', id: 26000021 },
                { name: 'minion-horde', id: 26000022 },
                { name: 'ice-wizard', id: 26000023 },
                { name: 'royal-giant', id: 26000024 },
                { name: 'guards', id: 26000025 },
                { name: 'princess', id: 26000026 },
                { name: 'dark-prince', id: 26000027 },
                { name: 'three-musketeers', id: 26000028 },
                { name: 'lava-hound', id: 26000029 },
                { name: 'ice-spirit', id: 26000030 },
                { name: 'fire-spirits', id: 26000031 },
                { name: 'miner', id: 26000032 },
                { name: 'sparky', id: 26000033 },
                { name: 'bowler', id: 26000034 },
                { name: 'lumberjack', id: 26000035 },
                { name: 'battle-ram', id: 26000036 },
                { name: 'inferno-dragon', id: 26000037 },
                { name: 'ice-golem', id: 26000038 },
                { name: 'mega-minion', id: 26000039 },
                { name: 'dart-goblin', id: 26000040 },
                { name: 'goblin-gang', id: 26000041 },
                { name: 'electro-wizard', id: 26000042 },
                { name: 'elite-barbarians', id: 26000043 },
                { name: 'hunter', id: 26000044 },
                { name: 'executioner', id: 26000045 },
                { name: 'bandit', id: 26000046 },
                { name: 'royal-recruits', id: 26000047 },
                { name: 'night-witch', id: 26000048 },
                { name: 'bats', id: 26000049 },
                { name: 'royal-ghost', id: 26000050 },
                { name: 'ram-rider', id: 26000051 },
                { name: 'zappies', id: 26000052 },
                { name: 'rascals', id: 26000053 },
                { name: 'cannon-cart', id: 26000054 },
                { name: 'mega-knight', id: 26000055 },
                { name: 'skeleton-barrel', id: 26000056 },
                { name: 'flying-machine', id: 26000057 },
                { name: 'wall-breakers', id: 26000058 },
                { name: 'royal-hogs', id: 26000059 },
                { name: 'goblin-giant', id: 26000060 },
                { name: 'fisherman', id: 26000061 },
                { name: 'magic-archer', id: 26000062 },
                { name: 'electro-dragon', id: 26000063 },
                { name: 'firecracker', id: 26000064 },
                { name: 'elixir-golem', id: 26000067 },
                { name: 'battle-healer', id: 26000068 },
                { name: 'skeleton-dragons', id: 26000080 },
                { name: 'mother-witch', id: 26000083 },
                { name: 'electro-spirit', id: 26000084 },
                { name: 'electro-giant', id: 26000085 },
                { name: 'cannon', id: 27000000 },
                { name: 'goblin-hut', id: 27000001 },
                { name: 'mortar', id: 27000002 },
                { name: 'inferno-tower', id: 27000003 },
                { name: 'bomb-tower', id: 27000004 },
                { name: 'barbarian-hut', id: 27000005 },
                { name: 'tesla', id: 27000006 },
                { name: 'elixir-collector', id: 27000007 },
                { name: 'x-bow', id: 27000008 },
                { name: 'tombstone', id: 27000009 },
                { name: 'furnace', id: 27000010 },
                { name: 'goblin-cage', id: 27000012 },
                { name: 'fireball', id: 28000000 },
                { name: 'arrows', id: 28000001 },
                { name: 'rage', id: 28000002 },
                { name: 'rocket', id: 28000003 },
                { name: 'goblin-barrel', id: 28000004 },
                { name: 'freeze', id: 28000005 },
                { name: 'mirror', id: 28000006 },
                { name: 'lightning', id: 28000007 },
                { name: 'zap', id: 28000008 },
                { name: 'poison', id: 28000009 },
                { name: 'graveyard', id: 28000010 },
                { name: 'the-log', id: 28000011 },
                { name: 'tornado', id: 28000012 },
                { name: 'clone', id: 28000013 },
                { name: 'earthquake', id: 28000014 },
                { name: 'barbarian-barrel', id: 28000015 },
                { name: 'heal-spirit', id: 28000016 },
                { name: 'giant-snowball', id: 28000017 },
                { name: 'royal-delivery', id: 28000018 }
            ]

            let url = 'https://link.clashroyale.com/deck/en?deck=';

            for(let i = 0; i < cardsToInclude.length; i++) {
                url += ids.find(c => c.name === cardsToInclude[i]).id;
                
                if(i !== cardsToInclude.length - 1) url += ';';
            }

            return url;
        };

        cards.sort((a, b) => {
            return b.level - a.level;
        });
        
        const cardsUsed = [];
        let cardSelection = [];
        let levelIterator = 13;

        do {
            const cardsByLevel = cards.filter(c => c.level === levelIterator).map(c => c.name);
            cardSelection = cardSelection.concat(cardsByLevel);
            levelIterator--;
        } while (cardSelection.length < 50 && levelIterator > 0);


        const decks = [];

        do{
            try{
                const res = await got(url(cardSelection, cardsUsed));
                const $ = cheerio.load(res.body);

                //first deck with all cards available
                const deck = $('div.deck_segment').first().attr('data-name').split(',');

                deck.forEach(c => cardsUsed.push(c)); //add to cards used

                //remove cards from card selection
                cardsUsed.forEach(c => {
                    const index = cardSelection.indexOf(c);
                    if(index >= 0){
                        cardSelection.splice(index, 1);
                    }
                });

                decks.push(deck); //add new deck
            } catch(e){
                console.log('error in deck request RoyaleAPI')
            }
        } while(decks.length < 4);

        const desc = () => {
            let desc = ``;

            decks.forEach((d, i) => {
                desc += `**Deck ${i+1}**: [Copy](${copyURL(d)})\n`;

                d.forEach(c => {
                    const emoji = bot.emojis.cache.find(e => e.name === c.replace('-', ''));
                    desc += `<:${emoji.name}:${emoji.id}>`;
                });

                desc += '\n\n';
            });

            return desc;
        }

        const decksEmbed = {
            title: `__Optimal War Decks for ${name}__`,
            description: desc(),
            color: clanUtil.hex,
            thumbnail: {
                url: clanUtil.logo
            },
            footer: {
                text: 'Credit to RoyaleAPI for deck statistics'
            }
        }
        
        message.channel.send({ embed: decksEmbed });

        message.channel.stopTyping();
        
    }
}