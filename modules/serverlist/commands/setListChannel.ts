import { ChannelType, PermissionFlagsBits } from "discord.js";
import ServerlistModule from "..";
import SlashCommandBuilder from "../../../core/loaders/objects/customSlashCommandBuilder";

const Command = new SlashCommandBuilder()
  .setName("setlistchannel")
  .setDescription("Set the channel to post the server data in")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to post the server data in")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  .setFunction(async (interaction) => {
    const channel = interaction.options.getChannel("channel", true);
    ServerlistModule.getServerlistModule().persistantStorage.set("channelId", channel.id);
    await interaction.reply(`Set the list channel to <#${channel.id}>`);
  });

export default Command;

// Use the "command" snippet to create a new command
