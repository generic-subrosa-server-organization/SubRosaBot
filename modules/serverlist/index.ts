import { EmbedBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } from "discord.js";
import { bot } from "../../core";
import Module from "../../core/base/module";
import Bot from "../../core/bot";
import Time, { ms } from "../../core/utils/time";
import EmbedGenerator from "./embedGenerator";

export default class ServerlistModule extends Module<
  {},
  {
    channelId: string;
    messageId: string;
    lastDay: {
      [serverAddress: string]: {
        timestamp: number;
        playerCount: number;
      }[];
    };
  }
> {
  public name = "serverlist";
  public description = "No description provided";

  constructor(public bot: Bot) {
    super(bot);

    this.persistantStorage.setName(this.name);
  }

  public timer = setInterval(() => {
    EmbedGenerator.updateEmbeds();
  }, ms("1 m"));

  override async onLoad(): Promise<boolean> {
    EmbedGenerator.updateEmbeds();

    // register buttons
    bot.buttonManager.registerButton("credits", async (interaction) => {
      const embed = new EmbedBuilder()
        .setTitle("Credits")
        .setDescription(
          [
            "This bot was developed by `gart` ([website](https://gart.sh) | [github](https://github.com/gurrrrrrett3))",
            "Live server data is provided by `jpxs.international` ([website](https://jpxs.io) | [discord](https://discord.gg/jpxs))",
            "jpxs.international uses a modified version of a library by `jdb` ([github](https://github.com/jdbool/)), and is based off of oxs.international ([website](https://oxs.international))",
            "RosaClassic is a community master server developed by `checkraisefold` and `gart` to play older versions of Sub Rosa ([discord](https://discord.gg/mtpCMTAPp3))",
          ].join("\n")
        )
        .setColor(Colors.Blue);

      await interaction.reply({ embeds: [embed], ephemeral: true });
    });

    bot.buttonManager.registerButton("rosaclassic", async (interaction) => {
      const embed = new EmbedBuilder()
        .setTitle("RosaClassic")
        .setDescription(
          [
            "RosaClassic allows you to host and join Sub Rosa servers running versions 25 through 34",
            "",
            "**How to join a RosaClassic Server**",
            "",
            "1. Join the [RosaClassic Discord](https://gart.sh/rosaclassic)",
            "2. Check the #downloads channel for the custom client",
            "3. Download the version that you want to play",
            "4. Unzip the file and run the executable for your operating system",
            "",
            "That's it! Enjoy RosaClassic!",
          ].join("\n")
        )
        .setColor(Colors.Blue);

      const buttons = new ActionRowBuilder<ButtonBuilder>().setComponents([
        new ButtonBuilder()
          .setLabel("RosaClassic")
          .setStyle(ButtonStyle.Link)
          .setURL("https://gart.sh/rosaclassic"),
      ]);

      await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    });

    return true;
  }

  public static getServerlistModule() {
    return bot.moduleLoader.getModuleForced<ServerlistModule>("serverlist");
  }
}
