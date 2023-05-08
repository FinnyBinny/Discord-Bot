const { Client, GatewayIntentBits, ModalBuilder, Partials, ActivityType, AttachmentBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType, ButtonBuilder, ButtonStyle, TextInputBuilder, TextInputStyle, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection, ChannelType, Events, MessageType, UserFlagsBitField, InteractionResponse, ReactionUserManager } = require(`discord.js`);
const fs = require('fs');
const GiveawaysManager = require("./utils/giveaway");
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, Object.keys(GatewayIntentBits)], partials: [Partials.Channel, Partials.Reaction, Partials.Message]}); 

client.on("ready", async (client) => {
 
    setInterval(() => {

        let activities = [
            { type: 'Watching', name: 'for customers!!'},
            { type: 'Watching', name: `the post office!`},
            { type: 'Watching', name: `over Shipping Studio! <3`},
            { type: 'Playing', name: `Shipping Studio! <3`}
        ];

        const status = activities[Math.floor(Math.random() * activities.length)];

        if (status.type === 'Watching') {
            client.user.setPresence({ activities: [{ name: `${status.name}`, type: ActivityType.Watching }]});
        } else {
            client.user.setPresence({ activities: [{ name: `${status.name}`, type: ActivityType.Playing }]});
        }
        
    }, 5000);
})

const axios = require('axios');
const fetch = require("node-fetch");
const warningSchema = require('./Schemas.js/warn');
const { CaptchaGenerator } = require('captcha-canvas');
const voiceschema = require('./Schemas.js/voicechannels');
const welcomeschema = require('./Schemas.js/welcome');
const botschema = require('./Schemas.js/botsvoicechannels');
const roleschema = require('./Schemas.js/autorole');
const pingschema = require('./Schemas.js/joinping');
const starschema = require('./Schemas.js/starboard');
const starmessageschema = require('./Schemas.js/starmessages');
const capschema = require('./Schemas.js/verify');
const verifyusers = require('./Schemas.js/verifyusers');
const joinschema = require('./Schemas.js/jointocreate');
const joinchannelschema = require('./Schemas.js/jointocreatechannels');
const reactschema = require('./Schemas.js/reactionroles');

client.commands = new Collection();

require('dotenv').config();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./src/commands");

// HANDLE ALL ERRORS!! //

const process = require('node:process');

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Giveaway Manager //

client.giveawayManager = new GiveawaysManager(client, {
    default: {
      botsCanWin: false,
      embedColor: "#a200ff",
      embedColorEnd: "#550485",
      reaction: "🎉",
    },
});

// Commands //

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFolders, "./src/commands");
    client.login(process.env.token)
})();

// Counting System //

client.on(Events.MessageCreate, async message => {

    const countschema = require('./Schemas.js/counting');
    if (message.guild === null) return;
    const countdata = await countschema.findOne({ Guild: message.guild.id });
    let reaction = "";

    if (!countdata) return;

    let countchannel = client.channels.cache.get(countdata.Channel);

    if (message.author.bot) return;
    if (message.channel.id !== countchannel.id) return;

    if (countdata.Count > 98) {
        reaction = '✔️'
    } else if (countdata.Count > 48) {
        reaction = '☑️'
    } else {
        reaction = '✅'
    }
    
    if (message.author.id === countdata.LastUser) {

        message.reply({ content: `You **cannot** count alone! You **messed up** the counter at **${countdata.Count}**! Back to **0**.`});
        countdata.Count = 0;
        countdata.LastUser = ' ';

        try {
            message.react('❌')
        } catch (err) {
        
        }

    } else {

        if (message.content - 1 < countdata.Count && countdata.Count === 0 && message.author.id !== countdata.LastUser) {

            message.reply({ content: `The **counter** is at **0** by default!`})
            message.react('⚠')
    
        } else if (message.content - 1 < countdata.Count || message.content === countdata.Count || message.content > countdata.Count + 1 && message.author.id !== countdata.LastUser) {
            message.reply({ content: `You **messed up** the counter at **${countdata.Count}**! Back to **0**.`})
            countdata.Count = 0;

            try {
                message.react('❌')
            } catch (err) {
                
            }
    
        } else if (message.content - 1 === countdata.Count && message.author.id !== countdata.LastUser) {
                
            countdata.Count += 1;

            try {
                message.react(`${reaction}`)
            } catch (err) {
                
            }
    
            countdata.LastUser = message.author.id;
        }

    }
    
    countdata.save();
})

// Leave Message //

client.on(Events.GuildMemberRemove, async (member, err) => {

    const leavedata = await welcomeschema.findOne({ Guild: member.guild.id });

    if (!leavedata) return;
    else {

        const channelID = leavedata.Channel;
        const channelwelcome = member.guild.channels.cache.get(channelID);

        const embedleave = new EmbedBuilder()
        .setColor("DarkBlue")
        .setTitle(`${member.user.username} has left`)
        .setDescription( `> ${member} has left the Server`)
        .setFooter({ text: `👋 Cast your goobyes`})
        .setTimestamp()
        .setAuthor({ name: `👋 Member Left`})

        const welmsg = await channelwelcome.send({ embeds: [embedleave]}).catch(err);
        welmsg.react('👋');
    }
})

// Welcome Message //

client.on(Events.GuildMemberAdd, async (member, err) => {

    const welcomedata = await welcomeschema.findOne({ Guild: member.guild.id });

    if (!welcomedata) return;
    else {

        const channelID = welcomedata.Channel;
        const channelwelcome = member.guild.channels.cache.get(channelID)
        const roledata = await roleschema.findOne({ Guild: member.guild.id });

        if (roledata) {
            const giverole = await member.guild.roles.cache.get(roledata.Role)

            member.roles.add(giverole).catch(err => {
                console.log('Error received trying to give an auto role!');
            })
        }
        
        const embedwelcome = new EmbedBuilder()
         .setColor("DarkBlue")
         .setTitle(`${member.user.username} has arrived \n to the Server!`)
         .setDescription( `> Welcome ${member} to the Server!`)
         .setFooter({ text: `👋 Get cozy and enjoy :)`})
         .setTimestamp()
         .setAuthor({ name: `👋 Welcome to the Server!`})

    
        const embedwelcomedm = new EmbedBuilder()
         .setColor("DarkBlue")
         .setTitle('Welcome Message')
         .setDescription( `> Welcome to ${member.guild.name}!`)
         .setFooter({ text: `👋 Get cozy and enjoy :)`})
         .setTimestamp()
         .setAuthor({ name: `👋 Welcome to the Server!`})

    
        const levmsg = await channelwelcome.send({ embeds: [embedwelcome]});
        levmsg.react('👋');
        member.send({ embeds: [embedwelcomedm]}).catch(err => console.log(`Welcome DM error: ${err}`))
    
    } 
})

// Status //

client.on("ready", () => {
    console.log('Bot is online.');

    client.user.setStatus("dnd");

})

// Sticky Message Code //

const stickyschema = require('./Schemas.js/sticky');
const sticky = require('./commands/Moderation/sticky');

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    stickyschema.findOne({ ChannelID: message.channel.id}, async (err, data) => {
        if (err) throw err;

        if (!data) {
            return;
        }

        let stickychannel = data.ChannelID;
        let cachedChannel = client.channels.cache.get(stickychannel);
        
        const embed = new EmbedBuilder()

        .setTitle('> Sticky Note')
        .setAuthor({ name: '📝 Sticky Message Tool'})
        .setFooter({ text: '📝 Sticky Message Created'})
        .addFields({ name: '• Sticky Content', value: `> ${data.Message}`})
        .setColor("DarkBlue")
        .setTimestamp()

        if (message.channel.id == (stickychannel)) {

            data.CurrentCount += 1;
            data.save();

            if (data.CurrentCount > data.MaxCount) {
                try {
                    await client.channels.cache.get(stickychannel).messages.fetch(data.LastMessageID).then(async(m) => {
                        await m.delete();
                    })

                    let newMessage = await cachedChannel.send({ embeds: [embed]})

                    data.LastMessageID = newMessage.id;
                    data.CurrentCount = 0;
                    data.save();
                } catch {
                    return;
                }
            }
        }
    })
})

// Anti-Link System Code //

const linkSchema = require('./Schemas.js/link');

client.on(Events.MessageCreate, async (message) => {

    if (message.guild === null) return;
     
    if (message.content.startsWith('http') || message.content.startsWith('discord.gg') || message.content.includes('https://') || message.content.includes('http://') || message.content.includes('discord.gg/') || message.content.includes('www.') || message.content.includes('.net') || message.content.includes('.com')) {

        const Data = await linkSchema.findOne({ Guild: message.guild.id });

        if (!Data) return;

        const memberPerms = Data.Perms;

        const user = message.author;
        const member = message.guild.members.cache.get(user.id);

        const embed = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({ name: '🔗 Anti-link system'})
        .setTitle('Message removed')
        .setFooter({ text: '🔗 Anti-link detected a link'})
        .setDescription(`> ${message.author}, links are **disabled** in **${message.guild.name}**.`)
        .setTimestamp()

        if (member.permissions.has(memberPerms)) return;
        else {
            await message.channel.send({ embeds: [embed] }).then (msg => {
                setTimeout(() => msg.delete(), 5000)
            })

            ;(await message).delete();

            warningSchema.findOne({ GuildID: message.guild.id, UserID: message.author.id, UserTag: message.author.tag }, async (err, data) => {

                if (err) throw err;
    
                if (!data) {
                    data = new warningSchema({
                        GuildID: message.guild.id,
                        UserID: message.author.id,
                        UserTag: message.author.tag,
                        Content: [
                            {
                                ExecuterId: '1068945636105400512',
                                ExecuterTag: 'Shipping Bot#2121',
                                Reason: 'Use of forbidden links'
                            }
                        ],
                    });
     
                } else {
                    const warnContent = {
                        ExecuterId: '1068945636105400512',
                        ExecuterTag: 'Shipping Bot#2121',
                        Reason: 'Use of forbidden links'
                    }
                    data.Content.push(warnContent);
                }
                data.save()
            })
        }
    }
})

// Leveling System Code //

const levelSchema = require('./Schemas.js/level');
const levelschema = require('./Schemas.js/levelsetup');

client.on(Events.MessageCreate, async (message, err) => {

    const { guild, author } = message;
    if (message.guild === null) return;
    const leveldata = await levelschema.findOne({ Guild: message.guild.id });

    if (!leveldata || leveldata.Disabled === 'disabled') return;
    let multiplier = 1;
    
    multiplier = Math.floor(leveldata.Multi);
    

    if (!guild || author.bot) return;

    levelSchema.findOne({ Guild: guild.id, User: author.id}, async (err, data) => {

        if (err) throw err;

        if (!data) {
            levelSchema.create({
                Guild: guild.id,
                User: author.id,
                XP: 0,
                Level: 0
            })
        }
    })

    const channel = message.channel;

    const give = 1;

    const data = await levelSchema.findOne({ Guild: guild.id, User: author.id});

    if (!data) return;

    const requiredXP = data.Level * data.Level * 20 + 20;

    if (data.XP + give >= requiredXP) {

        data.XP += give;
        data.Level += 1;
        await data.save();
        
        if (!channel) return;

        const levelembed = new EmbedBuilder()
        .setColor("Purple")
        .setTitle(`> ${author.username} has Leveled Up!`)
        .setFooter({ text: `⬆ ${author.username} Leveled Up`})
        .setTimestamp()
        .addFields({ name: `• New Level Unlocked`, value: `> ${author.username} is now level **${data.Level}**!`})
        .setAuthor({ name: `⬆ Level Playground`})

        await message.channel.send({ embeds: [levelembed] }).catch(err => console.log('Error sending level up message!'));
    } else {

        if(message.member.roles.cache.find(r => r.id === leveldata.Role)) {
            data.XP += give * multiplier;
        } data.XP += give;
        data.save();
    }
})

// Ghost Ping Code //

const ghostSchema = require('./Schemas.js/ghostping');
const numSchema = require('./Schemas.js/ghostNum');

client.on(Events.MessageDelete, async message => {

    if (message.guild === null) return;

    const Data = await ghostSchema.findOne({ Guild: message.guild.id });
    if (!Data) return;

    if (!message.author) return;
    if (message.author.bot) return;
    if (!message.author.id === client.user.id) return;
    if (message.author === message.mentions.users.first()) return;

    if (message.mentions.users.first() || message.type === MessageType.reply) {

        if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        let number;
        let time = 30;

        const data = await numSchema.findOne({ Guild: message.guild.id, User: message.author.id });
        if (!data) {
            await numSchema.create({
                Guild: message.guild.id,
                User: message.author.id,
                Number: 1
            })

            number = 1;
        } else {
            data.Number += 1;
            await data.save();

            number = data.Number;
        }

        if (number == 2) time = 60;
        if (number == 3) time = 300;
        if (number == 4) time = 600;
        if (number == 5) time = 6000;
        if (number == 6) time = 12000;
        if (number == 7) time = 300000;
        if (number >= 8) time = 600000;

        const ghostembed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTimestamp()

        .setFooter({ text: `👻 Ghost ping Detected`})
        .setAuthor({ name: `👻 Anti-Ghost-Ping System`})
        .setTitle('Ghost pings are not Allowed')
        .setDescription(`> **${message.author}**, stop ghosting people.`)

        const ghostdmembed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTimestamp()

        .setFooter({ text: `👻 Warned for ghost pinging`})
        .setAuthor({ name: `👻 Anti-Ghost-Ping System`})
        .setTitle('Ghost pings are not Allowed')
        .setDescription(`> You were warned and timedout in **${message.guild.name}** for ghost pinging`)

        const msg = await message.channel.send({ embeds: [ghostembed] });
        setTimeout(() => msg.delete(), 5000);

        const member = message.member;

        
        await member.timeout(time * 1000, 'Ghost pinging.');
        await member.send({ embeds: [ghostdmembed] }).catch(err => {
            return;
        })

            warningSchema.findOne({ GuildID: message.guild.id, UserID: message.author.id, UserTag: message.author.tag }, async (err, data) => {

            if (err) throw err;
    
            if (!data) {
                data = new warningSchema({
                    GuildID: message.guild.id,
                    UserID: message.author.id,
                    UserTag: message.author.tag,
                    Content: [
                        {
                            ExecuterId: '1068945636105400512',
                            ExecuterTag: 'Shipping Manager#2121',
                            Reason: 'Ghost Pinging/Replying'
                        }
                    ],
                });
     
            } else {
                const warnContent = {
                    ExecuterId: '1068945636105400512',
                    ExecuterTag: 'Shipping Bot#2121',
                    Reason: 'Ghost Pinging/Replying'
                }
                data.Content.push(warnContent);
            }
            data.save()
        })
        
    }
})

// AFK System Code //

const afkSchema = require('./Schemas.js/afkschema');
const { factorialDependencies, leftShift } = require('mathjs');

client.on(Events.MessageCreate, async (message) => {

    if (message.author.bot) return;

    if (message.guild === null) return;
    const afkcheck = await afkSchema.findOne({ Guild: message.guild.id, User: message.author.id});
    if (afkcheck) {
        const nick = afkcheck.Nickname;

        await afkSchema.deleteMany({
            Guild: message.guild.id,
            User: message.author.id
        })
        
        await message.member.setNickname(`${nick}`).catch(Err => {
            return;
        })

        const m1 = await message.reply({ content: `Hey, you are **back**!`, ephemeral: true})
        setTimeout(() => {
            m1.delete();
        }, 4000)
    } else {
        
        const members = message.mentions.users.first();
        if (!members) return;
        const afkData = await afkSchema.findOne({ Guild: message.guild.id, User: members.id })

        if (!afkData) return;

        const member = message.guild.members.cache.get(members.id);
        const msg = afkData.Message;

        if (message.content.includes(members)) {
            const m = await message.reply({ content: `${member.user.tag} is currently AFK, let's keep it down.. \n> **Reason**: ${msg}`, ephemeral: true});
            setTimeout(() => {
                m.delete();
                message.delete();
            }, 4000)
        }
    }
})

// Ping Bot + Fun //

client.on(Events.MessageCreate, async message => {

    if (message.author.bot) return;

    const inputmessage = message.content.toLowerCase();

    if (message.content == '<@1068945636105400512>' || inputmessage === 'hey Shipping Manager' && message.author.id !== '1068945636105400512') {

        const msg = await message.reply({ content: `Hello there **${message.author}** :) Use </help manual:1081529934884917279> to get a list of my features!`, ephemeral: true});
        setTimeout(() => {
            try {
                msg.delete();
                message.delete();
            } catch (err) {
                return;
            }
        }, 5000)

    }

    if (inputmessage.includes('Shipping Manager sucks') && message.author.id === '619944734776885276' && message.author.id !== '1068945636105400512') {

        const msg = await message.reply({ content: `Bro what the hell, I am literaly your son 😭`});
        setTimeout(() => {
            try {
                msg.delete();
                message.delete();
            } catch (err) {
                return;
            }
        }, 5000)

    } else if (inputmessage.includes('Shipping Manager sucks') && message.author.id !== '1068945636105400512') {

        const msg = await message.reply({ content: `:(`})
        setTimeout(() => {
            try {
                msg.delete();
                message.delete();
            } catch (err) {
                return;
            }
        }, 5000)
    }
})



// Member Voice Channels Code //

client.on(Events.GuildMemberAdd, async (member, err) => {

    if (member.guild === null) return;
    const voicedata = await voiceschema.findOne({ Guild: member.guild.id });

    if (!voicedata) return;
    else {

        const totalvoicechannel = member.guild.channels.cache.get(voicedata.TotalChannel);
        if (!totalvoicechannel || totalvoicechannel === null) return;
        const totalmembers = member.guild.memberCount;

        totalvoicechannel.setName(`• Total Members: ${totalmembers}`).catch(err);

    }
})

client.on(Events.GuildMemberRemove, async (member, err) => {

    if (member.guild === null) return;
    const voicedata1 = await voiceschema.findOne({ Guild: member.guild.id });

    if (!voicedata1) return;
    else {

        const totalvoicechannel1 = member.guild.channels.cache.get(voicedata1.TotalChannel);
        if (!totalvoicechannel1 || totalvoicechannel1 === null) return;
        const totalmembers1 = member.guild.memberCount;

        totalvoicechannel1.setName(`• Total Members: ${totalmembers1}`).catch(err);
    
    }
})

// Total Bots Voice Channel Code //

client.on(Events.GuildMemberAdd, async (member, err) => {

    if (member.guild === null) return;
    const botdata = await botschema.findOne({ Guild: member.guild.id });

    if (!botdata) return;
    else {

        const botvoicechannel = member.guild.channels.cache.get(botdata.BotChannel);
        if (!botvoicechannel || botvoicechannel === null) return;
        const botslist = member.guild.members.cache.filter(member => member.user.bot).size;

        botvoicechannel.setName(`• Total Bots: ${botslist}`).catch(err);

    }
})

client.on(Events.GuildMemberRemove, async (member, err) => {

    if (member.guild === null) return;
    const botdata1 = await botschema.findOne({ Guild: member.guild.id });

    if (!botdata1) return;
    else {

        const botvoicechannel1 = member.guild.channels.cache.get(botdata1.BotChannel);
        if (!botvoicechannel1 || botvoicechannel1 === null) return;
        const botslist1 = member.guild.members.cache.filter(member => member.user.bot).size;

        botvoicechannel1.setName(`• Total Bots: ${botslist1}`).catch(err);
    
    }
})

// Join Ping Code //

client.on(Events.GuildMemberAdd, async (member, err) => {

    const pingdata = await pingschema.findOne({ Guild: member.guild.id });

    if (!pingdata) return;
    else {

        await Promise.all(pingdata.Channel.map(async pingeddata => {

            const pingchannels = await client.channels.fetch(pingeddata);
            const message = await pingchannels.send(`${member}`).catch(err);
            
            setTimeout(() => {
                
                try {
                    message.delete();
                } catch (err) {
                    return;
                }

            }, 1000)
        }));
    }
})

// Starboard System //

client.on(Events.MessageReactionAdd, async (reaction, err) => {

    if (reaction.emoji.name === '⭐') {

        try {
            await reaction.fetch();
        } catch (error) {
            return;
        }

        const stardata = await starschema.findOne({ Guild: reaction.message.guild.id });
        const reactions = reaction.message.reactions.cache.get('⭐').count;

        const messagedata = await starmessageschema.findOne({ Message: reaction.message.id })
        if (messagedata) {

            const reactmessage = await client.channels.cache.get(messagedata.Channel).messages.fetch(messagedata.Reaction);
            const newreactions = reactions;
            const receivedEmbed = await reactmessage.embeds[0];

            try {
                const newembed = EmbedBuilder.from(receivedEmbed).setFields({ name: `• Stars`, value: `> ${newreactions} ⭐`});
                reactmessage.edit({ embeds: [newembed]}).catch(err);
            } catch (err) {
                return;
            }
        }

        const id = reaction.message.id;

        if (!stardata) return;

        if (reactions > stardata.Count) {

            if (reaction.message.channel.id === stardata.Channel) return;
            if (stardata.SentMessages.includes(id)) return;
            if (stardata.BanUser.includes(reaction.message.author.id)) return;

            const starembed = new EmbedBuilder()
            .setColor('Yellow')
            .setAuthor({ name: `⭐ Starboard System`})
            .setTimestamp()
            .setFooter({ text: `⭐ Starred Message`})
            .setTitle(`• Message by: ${reaction.message.author.tag}`)
            .setDescription(`${reaction.message.content || 'No message given.'}`)
            .addFields({ name: `• Stars`, value: `> ${reactions} ⭐`})

            if (reaction.message.attachments.size > 0) {

                try {
                    starembed.setImage(`${reaction.message.attachments.first()?.url}`);
                } catch (err) {
                    console.log(`Couldn't set image for starboard.`);
                }

            }
           
            const starchannel = await reaction.message.guild.channels.cache.get(stardata.Channel);

            const starmsg = await starchannel.send({ embeds: [starembed] }).catch(err);

            await starmessageschema.create({
                Reaction: starmsg.id,
                Message: reaction.message.id,
                Channel: stardata.Channel
            })
            
            try {
                starmsg.react('⭐');
            } catch (err) {
                console.log('Error occured when reacting to a star message!')
            }

            await starschema.updateOne({ Guild: reaction.message.guild.id }, { $push: { SentMessages: id }});

        }
    }  
})

client.on(Events.MessageReactionRemove, async (reaction, err) => {

    if (reaction.guild === 'null') return;

    if (reaction.emoji.name === '⭐') {

        try {
            await reaction.fetch();
        } catch (error) {
            return;
        }

        const stardata = await starschema.findOne({ Guild: reaction.message.guild.id });
        
        const reactions = reaction.message.reactions.cache.get('⭐').count;

        const messagedata = await starmessageschema.findOne({ Message: reaction.message.id })
        if (messagedata) {

            const reactmessage = await client.channels.cache.get(messagedata.Channel).messages.fetch(messagedata.Reaction);
            const newreactions = reactions;
            const receivedEmbed = await reactmessage.embeds[0];

            if (reactions < stardata.Count) {

                try {
                    const newembed1 = EmbedBuilder.from(receivedEmbed).setFields({ name: `• Stars`, value: `> Not enough ⭐`});
                    reactmessage.edit({ embeds: [newembed1]}).catch(err);
                } catch (err) {
                    return;
                }

            } else {
                try {
                    const newembed2 = EmbedBuilder.from(receivedEmbed).setFields({ name: `• Stars`, value: `> ${newreactions} ⭐`});
                    reactmessage.edit({ embeds: [newembed2]}).catch(err);
                } catch (err) {
                    return;
                }
            }
        }  
    }
})

// VERIFICATION CAPTCHA SYSTEM CODE //

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.guild === null) return;

    const verifydata = await capschema.findOne({ Guild: interaction.guild.id });
    const verifyusersdata = await verifyusers.findOne({ Guild: interaction.guild.id, User: interaction.user.id });

    if (interaction.customId === 'verify') {

        if (!verifydata) return await interaction.reply({ content: `The **verification system** has been disabled in this server!`, ephemeral: true});

        if (verifydata.Verified.includes(interaction.user.id)) return await interaction.reply({ content: 'You have **already** been verified!', ephemeral: true})
        else {

            let letter = ['0','1','2','3','4','5','6','7','8','9','a','A','b','B','c','C','d','D','e','E','f','F','g','G','h','H','i','I','j','J','f','F','l','L','m','M','n','N','o','O','p','P','q','Q','r','R','s','S','t','T','u','U','v','V','w','W','x','X','y','Y','z','Z','@','!','.',',',':',';',")",'(',"*",'&','%','$','#','<','>',]
            let result = Math.floor(Math.random() * letter.length);
            let result2 = Math.floor(Math.random() * letter.length);
            let result3 = Math.floor(Math.random() * letter.length);
            let result4 = Math.floor(Math.random() * letter.length);
            let result5 = Math.floor(Math.random() * letter.length);

            const cap = letter[result] + letter[result2] + letter[result3] + letter[result4] + letter[result5];
            console.log(cap)

            const captcha = new CaptchaGenerator()
            .setDimension(150, 450)
            .setCaptcha({ text: `${cap}`, size: 60, color: "green"})
            .setDecoy({ opacity: 0.5 })
            .setTrace({ color: "green" })

            const buffer = captcha.generateSync();
            
            const verifyattachment = new AttachmentBuilder(buffer, { name: `captcha.png`});
            
            const verifyembed = new EmbedBuilder()
            .setColor('Green')
            .setAuthor({ name: `✅ Verification Proccess`})
            .setFooter({ text: `✅ Verification Captcha`})
            .setTimestamp()
            .setImage('attachment://captcha.png')
            .setTitle('> Verification Step: Captcha')
            .addFields({ name: `• Verify`, value: '> Please use the button bellow to \n> submit your captcha!'})

            const verifybutton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setLabel('✅ Enter Captcha')
                .setStyle(ButtonStyle.Success)
                .setCustomId('captchaenter')
            )

            const vermodal = new ModalBuilder()
            .setTitle('Verification')
            .setCustomId('vermodal')

            const answer = new TextInputBuilder()
            .setCustomId('answer')
            .setRequired(true)
            .setLabel('• Please sumbit your Captcha code')
            .setPlaceholder('Your captcha code')
            .setStyle(TextInputStyle.Short)

            const vermodalrow = new ActionRowBuilder().addComponents(answer);
            vermodal.addComponents(vermodalrow);

            try {
                const vermsg = await interaction.reply({ embeds: [verifyembed], components: [verifybutton], ephemeral: true, files: [verifyattachment] });

                const vercollector = vermsg.createMessageComponentCollector();

                vercollector.on('collect', async i => {

                    if (i.customId === 'captchaenter') {
                        i.showModal(vermodal);
                    }

                })

            } catch (err) {
                return;
            }

            if (verifyusersdata) {

                await verifyusers.deleteMany({
                    Guild: interaction.guild.id,
                    User: interaction.user.id
                })

                await verifyusers.create ({
                    Guild: interaction.guild.id,
                    User: interaction.user.id,
                    Key: cap
                })

            } else {

                await verifyusers.create ({
                    Guild: interaction.guild.id,
                    User: interaction.user.id,
                    Key: cap
                })

            }
        } 
    }
})

client.on(Events.InteractionCreate, async interaction => {

    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'vermodal') {

        const userverdata = await verifyusers.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
        const verificationdata = await capschema.findOne({ Guild: interaction.guild.id });

        if (verificationdata.Verified.includes(interaction.user.id)) return await interaction.reply({ content: `You are **already** verified within this server!`, ephemeral: true});
        
        const modalanswer = interaction.fields.getTextInputValue('answer');
        if (modalanswer === userverdata.Key) {

            const verrole = await interaction.guild.roles.cache.get(verificationdata.Role);

            try {
                await interaction.member.roles.add(verrole);
            } catch (err) {
                return await interaction.reply({ content: `There was an **issue** giving you the **<@&${verificationdata.Role}>** role, try again later!`, ephemeral: true})
            }


            await capschema.updateOne({ Guild: interaction.guild.id }, { $push: { Verified: interaction.user.id }});

            try {
                await interaction.reply({ content: 'You have been **verified!**', ephemeral: true});
            } catch (err) {
                return;
            }

        } else {
            await interaction.reply({ content: `**Oops!** It looks like you **didn't** enter the valid **captcha code**!`, ephemeral: true})
        }
    }
})

client.on(Events.GuildMemberRemove, async member => {
    try {
        await capschema.updateOne({ Guild: member.guild.id }, { $pull: { Verified: member.id }});
    } catch (err) {
        console.log(`Couldn't delete verify data`)
    }
})

// JOIN TO CREATE VOICE CHANNEL CODE //

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {

    try {
        if (newState.member.guild === null) return;
    } catch (err) {
        return;
    }

    if (newState.member.id === '1068945636105400512') return;

    const joindata = await joinschema.findOne({ Guild: newState.member.guild.id });
    const joinchanneldata1 = await joinchannelschema.findOne({ Guild: newState.member.guild.id, User: newState.member.id });

    const voicechannel = newState.channel;

    if (!joindata) return;

    if (!voicechannel) return;
    else {

        if (voicechannel.id === joindata.Channel) {

            if (joinchanneldata1) {
                
                try {

                    const joinfail = new EmbedBuilder()
                    .setColor('DarkRed')
                    .setTimestamp()
                    .setAuthor({ name: `🔊 Join to Create System`})
                    .setFooter({ text: `🔊 Issue Faced`})
                    .setTitle('> You tried creating a \n> voice channel but..')
                    .addFields({ name: `• Error Occured`, value: `> You already have a voice channel \n> open at the moment.`})

                    return await newState.member.send({ embeds: [joinfail] });

                } catch (err) {
                    return;
                }

            } else {

                try {

                    const channel = await newState.member.guild.channels.create({
                        type: ChannelType.GuildVoice,
                        name: `${newState.member.user.username}-room`,
                        userLimit: joindata.VoiceLimit,
                        parent: joindata.Category
                    })
                    
                    try {
                        await newState.member.voice.setChannel(channel.id);
                    } catch (err) {
                        console.log('Error moving member to the new channel!')
                    }   

                    setTimeout(() => {

                        joinchannelschema.create({
                            Guild: newState.member.guild.id,
                            Channel: channel.id,
                            User: newState.member.id
                        })

                    }, 500)
                    
                } catch (err) {

                    console.log(err)

                    try {

                        const joinfail = new EmbedBuilder()
                        .setColor('DarkRed')
                        .setTimestamp()
                        .setAuthor({ name: `🔊 Join to Create System`})
                        .setFooter({ text: `🔊 Issue Faced`})
                        .setTitle('> You tried creating a \n> voice channel but..')
                        .addFields({ name: `• Error Occured`, value: `> I could not create your channel, \n> perhaps I am missing some permissions.`})
    
                        await newState.member.send({ embeds: [joinfail] });
    
                    } catch (err) {
                        return;
                    }

                    return;

                }

                try {

                    const joinsuccess = new EmbedBuilder()
                    .setColor('DarkRed')
                    .setTimestamp()
                    .setAuthor({ name: `🔊 Join to Create System`})
                    .setFooter({ text: `🔊 Channel Created`})
                    .setTitle('> Channel Created')
                    .addFields({ name: `• Channel Created`, value: `> Your voice channel has been \n> created in **${newState.member.guild.name}**!`})

                    await newState.member.send({ embeds: [joinsuccess] });

                } catch (err) {
                    return;
                }
            }
        }
    }
})

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {

    try {
        if (oldState.member.guild === null) return;
    } catch (err) {
        return;
    }

    if (oldState.member.id === '1068945636105400512') return;

    const leavechanneldata = await joinchannelschema.findOne({ Guild: oldState.member.guild.id, User: oldState.member.id });

    if (!leavechanneldata) return;
    else {

        const voicechannel = await oldState.member.guild.channels.cache.get(leavechanneldata.Channel);

        if (newState.channel === voicechannel) return;

        try {
            await voicechannel.delete()
        } catch (err) {
            return;
        }

        await joinchannelschema.deleteMany({ Guild: oldState.guild.id, User: oldState.member.id })
        try {

            const deletechannel = new EmbedBuilder()
            .setColor('DarkRed')
            .setTimestamp()
            .setAuthor({ name: `🔊 Join to Create System`})
            .setFooter({ text: `🔊 Channel Deleted`})
            .setTitle('> Channel Deleted')
            .addFields({ name: `• Channel Deleted`, value: `> Your voice channel has been \n> deleted in **${newState.member.guild.name}**!`})

            await newState.member.send({ embeds: [deletechannel] });

        } catch (err) {
            return;
        } 
    }
})

// REACTION ROLE CODE //

client.on(Events.MessageReactionAdd, async (reaction, member) => {

    try {
        await reaction.fetch();
    } catch (error) {
        return;
    }

    if (!reaction.message.guild) return;
    else {

        const reactionroledata = await reactschema.find({ MessageID: reaction.message.id });

        await Promise.all(reactionroledata.map(async data => {
            if (reaction.emoji.id !== data.Emoji) return;
            else {

                const role = await reaction.message.guild.roles.cache.get(data.Roles);
                const addmember = await reaction.message.guild.members.fetch(member.id);

                if (!role) return;
                else {

                    try {
                        await addmember.roles.add(role)
                    } catch (err) {
                        return console.log(err);
                    }

                    try {

                        const addembed = new EmbedBuilder()
                        .setColor('DarkRed')
                        .setAuthor({ name: `💳 Reaction Role Tool`})
                        .setFooter({ text: `💳 Role Added`})
                        .setTitle('> You have been given a role!')
                        .setTimestamp()
                        .addFields({ name: `• Role`, value: `> ${role.name}`, inline: true}, { name: `• Emoji`, value: `> ${reaction.emoji}`, inline: true}, { name: `• Server`, value: `> ${reaction.message.guild.name}`, inline: false})
                        addmember.send({ embeds: [addembed] })
    
                    } catch (err) {
                        return;
                    }
                }
            }
        }))
    }
})

client.on(Events.MessageReactionRemove, async (reaction, member) => {

    try {
        await reaction.fetch();
    } catch (error) {
        return;
    }

    if (!reaction.message.guild) return;
    else {

        const reactionroledata = await reactschema.find({ MessageID: reaction.message.id });

        await Promise.all(reactionroledata.map(async data => {
            if (reaction.emoji.id !== data.Emoji) return;
            else {

                const role = await reaction.message.guild.roles.cache.get(data.Roles);
                const addmember = await reaction.message.guild.members.fetch(member.id);

                if (!role) return;
                else {

                    try {
                        await addmember.roles.remove(role)
                    } catch (err) {
                        return console.log(err);
                    }

                    try {

                        const removeembed = new EmbedBuilder()
                        .setColor('DarkRed')
                        .setAuthor({ name: `💳 Reaction Role Tool`})
                        .setFooter({ text: `💳 Role Removed`})
                        .setTitle('> You have removed from a role!')
                        .setTimestamp()
                        .addFields({ name: `• Role`, value: `> ${role.name}`, inline: true}, { name: `• Emoji`, value: `> ${reaction.emoji}`, inline: true}, { name: `• Server`, value: `> ${reaction.message.guild.name}`, inline: false})
                        addmember.send({ embeds: [removeembed] })
    
                    } catch (err) {
                        return;
                    }
                }
            }
        }))
    }
})

// SERVERS CODE - TEMPORARY //

client.on(Events.MessageCreate, async message => {
    if (message.author.id !== '619944734776885276') return;
    if (message.content !== '!^!servers') return;
    
    let owners = [ ];

    await Promise.all(client.guilds.cache.map(async guild => {
        const owner = await guild.members.fetch(guild.ownerId);
        owners.push(`${owner.user.username} - ${guild.id}`)
    }))

    console.log(`Shipping Manager IS IN ${client.guilds.cache.size} SERVERS \n\n ${owners.join('\n ')}`);
    message.reply('**Check** your console!')
})

// LEAVE GUILD - TEMPORARY //

client.on(Events.MessageCreate, async message => {
    if (message.author.id !== '619944734776885276') return;
    if (!message.content.startsWith('!^!leave')) return;
    else {

        const guild = await client.guilds.cache.get(message.content.slice(8, 2000))
        if (!guild) return message.reply('You idiot, that guild does not exist..');
        else {
            message.reply(`Left ${guild.name}`)
            await guild.leave();
        }
    }
})


    // Mod logs //
const Modlog = require('./Schemas.js/modlog');
const { AuditLogEvent } = require('discord.js');

client.on(Events.ChannelCreate, async (channel) => {
  const guildId = channel.guild.id;
  const modlog = await Modlog.findOne({ guildId });
 
  if (!modlog || !modlog.logChannelId) {
    return; // if there's no log channel set up, return without sending any log message
}
 
  channel.guild.fetchAuditLogs({
    type: AuditLogEvent.ChannelCreate,
  })
    .then(async (audit) => {
      const { executor } = audit.entries.first();
 
      const name = channel.name;
      const id = channel.id;
      let type = channel.type;
 
      if (type == 0) type = 'Text'
      if (type == 2) type = 'Voice'
      if (type == 13) type = 'Stage'
      if (type == 15) type = 'Form'
      if (type == 4) type = 'Announcement'
      if (type == 5) type = 'Category'
 
      const mChannel = await channel.guild.channels.cache.get(modlog.logChannelId);
 
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Channel Created')
        .addFields({ name: 'Channel Name', value: `${name} (<#${id}>)`, inline: false })
        .addFields({ name: 'Channel Type', value: `${type} `, inline: true })
        .addFields({ name: 'Channel ID', value: `${id} `, inline: true })
        .addFields({ name: 'Created By', value: `${executor.tag}`, inline: false })
        .setTimestamp()
        .setFooter({ text: 'Mod Logging by Shipping Manager' });
 
    mChannel.send({ embeds: [embed] })
 
    })
})
 
client.on(Events.ChannelDelete, async channel => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = channel.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
    })
    .then (async audit => {
        const { executor } = audit.entries.first()
 
        const name = channel.name;
        const id = channel.id;
        let type = channel.type;
 
        if (type == 0) type = 'Text'
        if (type == 2) type = 'Voice'
        if (type == 13) type = 'Stage'
        if (type == 15) type = 'Form'
        if (type == 4) type = 'Announcement'
        if (type == 5) type = 'Category'
 
        const mChannel = await channel.guild.channels.cache.get(modlog.logChannelId);
 
    const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("Channel Deleted")
    .addFields({ name: "Channel Name", value: `${name}`, inline: false})
    .addFields({ name: "Channel Type", value: `${type} `, inline: true})
    .addFields({ name: "Channel ID", value: `${id} `, inline: true})
    .addFields({ name: "Deleted By", value: `${executor.tag}`, inline: false})
    .setTimestamp()
    .setFooter({ text: "Mod Logging by Shipping Manager"})
 
    mChannel.send({ embeds: [embed] })
 
     })
})
 
client.on(Events.GuildBanAdd, async member => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = member.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    member.guild.fetchAuditLogs({
        type: AuditLogEvent.GuildBanAdd,
    })
    .then (async audit => {
        const { executor } = audit.entries.first()
 
        const name = member.user.username;
        const id = member.user.id;
 
 
    const mChannel = await member.guild.channels.cache.get(modlog.logChannelId)
 
    const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("Member Banned")
    .addFields({ name: "Member Name", value: `${name} (<@${id}>)`, inline: false})
    .addFields({ name: "Member ID", value: `${id} `, inline: true})
    .addFields({ name: "Banned By", value: `${executor.tag}`, inline: false})
    .setTimestamp()
    .setFooter({ text: "Mod Logging by Shipping Manager"})
 
    mChannel.send({ embeds: [embed] })
 
    })
})
 
client.on(Events.GuildBanRemove, async member => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = member.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    member.guild.fetchAuditLogs({
        type: AuditLogEvent.GuildBanRemove,
    })
    .then (async audit => {
        const { executor } = audit.entries.first()
 
        const name = member.user.username;
        const id = member.user.id;
 
 
    const mChannel = await member.guild.channels.cache.get(modlog.logChannelId)
 
    const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("Member Unbanned")
    .addFields({ name: "Member Name", value: `${name} (<@${id}>)`, inline: false})
    .addFields({ name: "Member ID", value: `${id} `, inline: true})
    .addFields({ name: "Unbanned By", value: `${executor.tag}`, inline: false})
    .setTimestamp()
    .setFooter({ text: "Mod Logging by Shipping Manager"})
 
    mChannel.send({ embeds: [embed] })
 
    })
})
 
client.on(Events.MessageDelete, async (message) => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = message.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    message.guild.fetchAuditLogs({
        type: AuditLogEvent.MessageDelete,
    })
    .then (async audit => {
        const { executor } = audit.entries.first()
 
        const mes = message.content;
 
        if (!mes) return
 
        const mChannel = await message.guild.channels.cache.get(modlog.logChannelId)
 
        const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Message Delete")
        .addFields({ name: "Message Content", value: `${mes}`, inline: false})
        .addFields({ name: "Message Channel", value: `${message.channel} `, inline: true})
        .addFields({ name: "Deleted By", value: `${executor.tag}`, inline: false})
        .setTimestamp()
        .setFooter({ text: "Mod Logging by Shipping Manager"})
 
        mChannel.send({ embeds: [embed] })
 
    })
})
 

 
client.on(Events.MessageBulkDelete, async messages => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = messages.first().guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    messages.first().guild.fetchAuditLogs({
        type: AuditLogEvent.MessageBulkDelete,
    })
    .then(async audit => {
        const { executor } = audit.entries.first();
 
        const mChannel = await messages.first().guild.channels.cache.get(modlog.logChannelId);
 
        const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Message Bulk Delete")
        .addFields({ name: "Message Channel", value: `${messages.first().channel} `, inline: true})
        .addFields({ name: "Bulk Deleted By", value: `${executor.tag}`, inline: false})
        .setTimestamp()
        .setFooter({ text: "Mod Logging by Shipping Manager" });
 
        mChannel.send({ embeds: [embed] });
    });
});
 
client.on(Events.GuildRoleCreate, async role => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = role.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleCreate,
    })
    .then(async audit => {
        const { executor } = audit.entries.first();
 
        const mChannel = await role.guild.channels.cache.get(modlog.logChannelId);
 
        const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Role Created")
        .addFields({ name: "Role Name", value: `<@&${role.id}> `, inline: true})
        .addFields({ name: "Role Created By", value: `${executor.tag}`, inline: false})
        .setTimestamp()
        .setFooter({ text: "Mod Logging by Shipping Manager" });
 
        mChannel.send({ embeds: [embed] });
    });
});
 
 
 
 
client.on(Events.GuildRoleDelete, async role => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = role.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleDelete,
    })
    .then(async audit => {
        const { executor } = audit.entries.first();
 
        const mChannel = await role.guild.channels.cache.get(modlog.logChannelId);
 
        const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Role Deleted")
        .addFields({ name: "Role Name", value: `${role.name} (${role.id})`, inline: true})
        .addFields({ name: "Role Deleted By", value: `${executor.tag}`, inline: false})
        .setTimestamp()
        .setFooter({ text: "Mod Logging by Shipping Manager" });
 
        mChannel.send({ embeds: [embed] });
    });
});
 
 
client.on(Events.GuildMemberAdd, async member => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = member.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    const mChannel = await member.guild.channels.cache.get(modlog.logChannelId);
 
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Member Joined")
        .addFields({ name: "Username", value: `${member.user.username}#${member.user.discriminator} (${member.user.id})`, inline: true})
        .addFields({ name: "Joined At", value: `${member.joinedAt.toUTCString()}`, inline: true})
        .setTimestamp()
        .setFooter({ text: "Mod Logging by Shipping Manager" });
 
    mChannel.send({ embeds: [embed] });
});
 
 
client.on(Events.GuildMemberRemove, async member => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = member.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    const mChannel = await member.guild.channels.cache.get(modlog.logChannelId);
 
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Member Left")
        .addFields({ name: "Username", value: `${member.user.username}#${member.user.discriminator} (${member.user.id})`, inline: true})
        .addFields({ name: "Left At", value: `${new Date().toUTCString()}`, inline: true})
        .setTimestamp()
        .setFooter({ text: "Mod Logging by Shipping Manager" });
 
    mChannel.send({ embeds: [embed] });
});
 
 
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (oldMember.nickname === newMember.nickname) {
        return; // if the nickname hasn't changed, return without sending any log message
    }
 
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = newMember.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    const mChannel = await newMember.guild.channels.cache.get(modlog.logChannelId);
 
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Nickname Changed")
        .addFields({ name: "Username", value: `${newMember.user.username}#${newMember.user.discriminator} (${newMember.user.id})`, inline: true })
        .addFields({ name: "Old Nickname", value: `${oldMember.nickname ? oldMember.nickname : 'None'}`, inline: true })
        .addFields({ name: "New Nickname", value: `${newMember.nickname ? newMember.nickname : 'None'}`, inline: true })
        .setTimestamp()
        .setFooter({ text: "Mod Logging by Shipping Manager" });
 
    mChannel.send({ embeds: [embed] });
});
 
 
client.on(Events.UserUpdate, async (oldUser, newUser) => {
    if (oldUser.username === newUser.username) {
        return; // if the username hasn't changed, return without sending any log message
    }
 
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = newUser.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    const mChannel = await newUser.guild.channels.cache.get(modlog.logChannelId);
 
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Username Changed")
        .addFields({ name: "User", value: `${newUser.username}#${newUser.discriminator} (${newUser.id})`, inline: true })
        .addFields({ name: "Old Username", value: `${oldUser.username}`, inline: true })
        .addFields({ name: "New Username", value: `${newUser.username}`, inline: true })
        .setTimestamp()
        .setFooter({ text: "Mod Logging by Shipping Manager" });
 
    mChannel.send({ embeds: [embed] });
});
 
 
 
client.on(Events.GuildMemberRemove, async (member) => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = member.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    member.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberKick,
    })
    .then (async audit => {
 
        const { executor } = audit.entries.first();
 
    const mChannel = await member.guild.channels.cache.get(modlog.logChannelId);
 
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Member Kicked")
        .addFields({ name: 'User', value: `${member.user.username}#${member.user.discriminator} (${member.user.id})` })
        .addFields({ name: "Kicked By", value: `${executor.tag}`, inline: false})
        .setFooter({ text: "Mod Logging by Shipping Manager" });
 
    mChannel.send({ embeds: [embed] });
    })
});
 
 
client.on(Events.InviteCreate, async (invite) => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = invite.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    const mChannel = await invite.guild.channels.cache.get(modlog.logChannelId);
 
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Invite Created")
        .addFields({ name: "Code", value: `${invite.code}`, inline: true })
        .addFields({ name: "Channel", value: `${invite.channel}`, inline: true })
        .addFields({ name: "Inviter", value: `${invite.inviter}`, inline: true })
        .setTimestamp()
        .setFooter({ text: "Mod Logging by Shipping Manager" });
 
    mChannel.send({ embeds: [embed] });
});
 
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = newMember.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
    newMember.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberUpdate,
    })
    .then (async audit => {
 
        const { executor } = audit.entries.first();
 
        const mChannel = await newMember.guild.channels.cache.get(modlog.logChannelId);
 
        if (oldMember.roles.cache.size < newMember.roles.cache.size) {
          const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
          const roleNameArray = addedRoles.map(role => `<@&${role.id}>`);
          const rolesAddedString = roleNameArray.join(", ");
 
          const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Roles Added")
            .addFields(
              { name: "User", value: `<@${newMember.id}>`, inline: true },
              { name: "Roles Added", value: rolesAddedString, inline: true },
              { name: "Role Added By", value: `${executor.tag}`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: "Mod Logging by Shipping Manager"});
 
          mChannel.send({ embeds: [embed] });
        }
    })
});
 
 
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const Modlog = require('./Schemas.js/modlog');
 
    const guildId = newMember.guild.id;
    const modlog = await Modlog.findOne({ guildId });
 
    if (!modlog || !modlog.logChannelId) {
        return; // if there's no log channel set up, return without sending any log message
    }
 
    newMember.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberRoleUpdate,
    })
    .then (async audit => {
 
        const { executor } = audit.entries.first();
        const mChannel = await newMember.guild.channels.cache.get(modlog.logChannelId);
 
        if (oldMember.roles.cache.size > newMember.roles.cache.size) {
            const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
            const roleNameArray = removedRoles.map(role => `<@&${role.id}>`);
            const rolesRemovedString = roleNameArray.join(", ");
 
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Roles Removed")
                .addFields(
                    { name: "User", value: `<@${newMember.id}>`, inline: true },
                    { name: "Roles Removed", value: rolesRemovedString, inline: true },
                    { name: "Role Removed By", value: `${executor.tag}`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: "Mod Logging by Shipping Manager"});
 
            mChannel.send({ embeds: [embed] });
        }
    });
});