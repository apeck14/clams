const { hex, getMembers } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");

module.exports = {
    name: 'link',
    execute: async (message, arg) => {
        if (arg) arg = (arg[0] !== '#') ? `#${arg}` : arg;
        if (!arg) return message.channel.send({embed: {color: hex, description: "No player tag given! (Ex: `?link #ABC123`)"}});
        
        try{
            const db = await mongoUtil.db("Clams");
            const collection = db.collection("Linked Accounts");
            const linked = await collection.findOne({"discordID": message.author.id});

            const members = await getMembers();
            const player = members.find(p => p.tag === arg);

            if(!player) return message.channel.send({embed: {color: hex, description: "You must be in the Clams to link your account!"}});

            //if user doesn't already have a linked account
            if(!linked){
                await collection.insertOne(
                    {   
                        discordName: message.author.username,
                        discordID: message.author.id,
                        tag: arg
                    }
                );

                return message.channel.send({embed: {color: hex, description: `✅ Account linked to **${player.name}**!`}});
            }
            //already linked to that tag
            else if(linked.tag === arg){
                return message.channel.send({embed: {color: hex, description: "You have already linked that ID!"}});
            }
            //already linked, send confirmation embed to update to new tag
            else{
                //send confirmatiom embed
                const confirmEmbed = await message.channel.send({embed: {color: hex, description: `Are you sure you want to link your account to a new ID?\n\n**Old ID:** ${linked.tag}\n**New ID:** ${arg}`}});
                
                const emojis = ['✅', '❌'];
                for(const e of emojis) await confirmEmbed.react(e);
                const emojiCollector = await confirmEmbed.awaitReactions((r, u) => u.id === message.author.id && emojis.includes(r.emoji.name), {max: 1, time: 20000});
                const firstReact = emojiCollector.first();

                //check reaction
                if(!firstReact || firstReact._emoji.name === '❌'){
                    confirmEmbed.delete();
                }
                else{
                    confirmEmbed.delete();

                    await collection.updateOne({discordID: message.author.id}, { $set: {tag: arg}});

                    return message.channel.send({embed: {color: hex, description: `✅ Updated! Account linked to **${player.name}**`}});
                }
            }
        } catch(e){
            console.dir(e);
            message.channel.send({embed: {color: hex, description: `Unexpected Error.`}});
        }
    }
}