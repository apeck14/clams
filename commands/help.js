const clanUtil = require("../util/clanUtil");

module.exports = {
    name: 'help',
    description: 'get list of commands',
    execute(message) {
      const commands = [
        {name: 'lb <FULL>', desc: 'Get Clams war leaderboard', main: true},
        {name: 'link <TAG>', desc: 'Link your CR account to Discord', main: true},
        {name: "player <TAG>", desc: "Get information about a player", main: true},
        {name: 'apply <TAG>', desc: 'Apply to join the Clams', main: false},
        {name: 'race', desc: 'Get current river race stats', main: true},
        {name: 'stats <TAG>', desc: 'Get war stats of a Clams member', main: true}
      ];
  
      commands.sort((a, b) => {
        if(a.name > b.name) return 1;
        else if(b.name > a.name) return -1;
        return 0;
      });

      const mainCommands = commands.filter(c => c.main).map(c => `\n• **?${c.name}** - ${c.desc}`).join('');
      const otherCommands = commands.filter(c => !c.main).map(c => `\n• **?${c.name}** - ${c.desc}`).join('');

      const helpEmbed = {
          color: clanUtil.hex,
          title: '__Commands__',
          description: mainCommands + (otherCommands ? '\n\n__**Other**__' : '') + otherCommands
      }
  
      message.channel.send({ embed: helpEmbed });
    },
};