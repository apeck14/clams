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

        const url = (cardsToInclude , cardsToExclude) => {
            let url = `https://royaleapi.com/decks/popular?time=14d&sort=rating&size=10&players=PvP&min_trophies=5600&max_trophies=10000&min_elixir=1&max_elixir=9&mode=detail&type=Ladder`;
            
            cardsToInclude.forEach(c => url += `&inc=${c}`); //cards to include
            cardsToExclude.forEach(c => url += `&exc=${c}`); //cards to exclude

            url += '&global_exclude=false';
            return url;
        }

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
                desc += `**Deck ${i+1}**:\n`;

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