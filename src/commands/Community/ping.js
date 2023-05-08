const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
  } = require("discord.js");
  const mongoose = require("mongoose");
  
  mongoose.set("strictQuery", true);
  // Connect to Mongoose
  mongoose.connect(process.env.MONGODBURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  // Create a model for testing purposes
  const Test = mongoose.model("Test", { name: String });
  
  module.exports = {
    ownerOnly: true, // Makes the command owner-only.
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Pong! View the speed of the bot's response.")
      .setDMPermission(false),
    async execute(interaction, client) {
      const icon = interaction.user.displayAvatarURL();
      const tag = interaction.user.tag;
      // Get Mongoose ping
      const dbPingStart = Date.now();
      await Test.findOne();
      const dbPing = Date.now() - dbPingStart;
  
      const embed = new EmbedBuilder()
        .setTitle("🏓 **PONG!**")
        .setDescription(
          `🍓| **Latency:** \`${client.ws.ping}ms\`\n🍉 | **Database Latency:** \`${dbPing}ms\``
        )
        .setColor("Blue")
        .setFooter({ text: `Requested by ${tag}`, iconURL: icon })
        .setTimestamp();
  
      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("btn")
          .setStyle(ButtonStyle.Secondary)
          .setLabel(`Reload`)
          .setEmoji("🔂")
      );
  
      const msg = await interaction.reply({ embeds: [embed], components: [btn] });
  
      const collector = msg.createMessageComponentCollector();
      collector.on("collect", async (i) => {
        if (i.customId == "btn") {
          i.update({
            content: `Refreshed The Ping Stats`,
            embeds: [
              new EmbedBuilder()
                .setTitle("🏓 **PONG!**")
                .setDescription(
                  `🍓| **Latency:** \`${client.ws.ping}ms\`\n🍉 | **Database Latency:** \`${dbPing}ms\``
                )
                .setColor("Blue")
                .setFooter({ text: `Requested by ${tag}`, iconURL: icon })
                .setTimestamp(),
            ],
            components: [btn],
          });
        }
      });
    },
  };