const { MessageEmbed } = require('discord.js');
const { hex, designatedChannelID } = require('../util.js');

module.exports = {
  name: 'help',
  description: 'get list of commands',
  async execute(message) {
    let embed = new MessageEmbed().setColor(hex);

    if (message.channel.id !== designatedChannelID) return message.channel.send(embed.setDescription(`Please use my commands in <#${designatedChannelID}>.`));

    const commands = [
      {name: "active", desc: "Get active members war info", main: true},
      {name: "attacks <C>", desc: "Get list of players with remaining war attacks", main: true},
      {name: "faq", desc: "Frequently asked questions", main: false},
      {name: "fw", desc: "Get final week information", main: true},
      {name: "lb", desc: "Show war leaderboard", main: true},
      {name: "link <PLAYERTAG>", desc: "Link Clash Royale tag to Discord account", main: false},
      {name: "matches", desc: "Get all members most recent war match times", main: true},
      {name: "overview", desc: "Overview for Clams (**ADMIN**)", main: true},
      {name: "stats <PLAYERTAG>", desc: "Get war stats for a Clams member", main: true},
      {name: "race", desc: "Get current river race information", main: true},
      {name: "apply", desc: "Apply to join Clams", main: false}
    ];

    commands.sort((a, b) => {
      if(a.name > b.name) return 1;
      else if(b.name > a.name) return -1;
      return 0;
    });

    let mainDesc = "";
    let otherDesc = "\n**__Other__**\n";

    for(const c of commands){
      const name = c.name;
      const d = c.desc;
      
      if(c.main) mainDesc += `• **?${name}** - ${d}\n`;
      else otherDesc += `• **?${name}** - ${d}\n`;
    }

    return message.channel.send(embed.setTitle('__Commands__').setDescription(mainDesc + otherDesc));
  },
};