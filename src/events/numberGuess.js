const { client } = require("discord.js");

client.on(Events.MessageCreate, async (message) => {
 
    if(message.author.bot) return;
     
    const Schema = require('../Schemas.js/guess');
     
    const data = await Schema.findOne({channelId: message.channel.id});
     
    if(!data) return;
     
    if(data) {
     
    if(message.content === `${data.number}`) {
        message.react(`✅`);
        message.reply(`Wow! That was the right number! 🥳`);
        message.pin();
     
        await data.delete();
        message.channel.send(`Successfully delted number, use \`/guess enable\` to get a new number!`)
    } 
     
     
    if(message.content !== `${data.number}`) return message.react(`❌`)
     
    }
     
    })