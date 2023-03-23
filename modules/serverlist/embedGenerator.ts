import { ActionRowBuilder, ActivityType, AttachmentBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder, GuildTextBasedChannel } from "discord.js";
import ServerlistModule from ".";
import fetch from "node-fetch";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import Logger from "../../core/utils/logger";
import { bot } from "../../core";

interface Server {
  address: string;
  port: number;
  latency: number;
  buffer: Buffer;
  name: string;
  version: number;
  build: string;
  clientCompatability: number;
  passworded: boolean;
  identifier: number;
  gameType: number;
  players: number;
  maxPlayers: number;
  masterServer: string;
}

// loadfonts
GlobalFonts.registerFromPath("assets/fonts/Lato-Black.ttf", "Lato-Black");
GlobalFonts.registerFromPath("assets/fonts/Lato-BlackItalic.ttf", "Lato-BlackItalic");
GlobalFonts.registerFromPath("assets/fonts/Lato-Light.ttf", "Lato-Light");

export const fonts = {
  Black: "Lato-Black",
  Italic: "Lato-BlackItalic",
  Light: "Lato-Light",
};

export default class EmbedGenerator {
  public static async updateEmbeds() {
    const channelId = ServerlistModule.getServerlistModule().persistantStorage.get("channelId");
    const messageId = ServerlistModule.getServerlistModule().persistantStorage.get("messageId");
    const lastDay = ServerlistModule.getServerlistModule().persistantStorage.get("lastDay");

    if (!channelId || !lastDay) {
      Logger.error("EmbedGenerator", "Serverlist not configured");

      const s = ServerlistModule.getServerlistModule().persistantStorage;

      s.set("channelId", "channelId");
      s.set("messageId", "messageId");
      s.set("lastDay", {});
    }

    const servers = await fetch("https://jpxs.international/api/servers")
      .then((res) => res.json().then((json) => json as Server[]))
      .then((servers) => servers.sort((a, b) => b.players - a.players))
      .catch((err) => {
        Logger.error("EmbedGenerator", "Failed to fetch serverlist", err);
        return [];
      });

    const padding = 10;

    const serverListWidth = 3;
    const serverListHeight = Math.ceil(servers.length / serverListWidth);

    const serverListCellWidth = 550;
    const serverListCellHeight = 200;

    const canvas = createCanvas(
      serverListWidth * serverListCellWidth,
      150 + serverListCellHeight * serverListHeight
    );
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "50px Lato-BlackItalic";
    ctx.textAlign = "center";
    ctx.fillText(servers.length > 0 ? "Sub Rosa Server List" : "No servers online" , canvas.width / 2, 70);

    servers.forEach((server, i) => {
      const x = (i % serverListWidth) * serverListCellWidth;
      const y = 100 + Math.floor(i / serverListWidth) * serverListCellHeight;

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5;
      ctx.strokeRect(
        x + padding,
        y + padding,
        serverListCellWidth - padding * 2,
        serverListCellHeight - padding * 2
      );

      ctx.fillStyle = "#ffffff";
      ctx.font = "30px Lato-Black";
      ctx.textAlign = "left";
      ctx.fillText(server.name, x + padding * 2, y + padding * 2 + 30);

      const maxPlayers = server.maxPlayers;
      const players = server.players;

      const playerCount = `${players}/${maxPlayers}`;

      ctx.fillStyle = "#ffffff";
      ctx.font = "30px Lato-Black";
      ctx.textAlign = "right";
      ctx.fillText(playerCount, x + serverListCellWidth - padding * 2, y + padding * 2 + 30);

      const textWidth = ctx.measureText(playerCount).width;

      // draw player bar
      ctx.strokeRect(
        x + serverListCellWidth - padding * 2 - textWidth - 10,
        y + padding * 2 + 40,
        textWidth + 10,
        20
      );

      ctx.fillRect(
        x + serverListCellWidth - padding * 2 - textWidth - 10,
        y + padding * 2 + 40,
        (textWidth + 10) * (players / maxPlayers),
        20
      );

      ctx.fillStyle = `hsl(${server.version * 50}, 100%, 50%)`;
      ctx.font = "20px Lato-Black";
      ctx.textAlign = "left";
      ctx.fillText(`${server.version}${server.build}`, x + padding * 2, y + padding * 2 + 60);

      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Lato-Black";
      ctx.textAlign = "left";
      ctx.fillText(`${server.latency}ms`, x + padding * 2 + 50, y + padding * 2 + 60);

      ctx.moveTo(x + padding * 2, y + padding * 2 + 80);
      ctx.lineTo(x + serverListCellWidth - padding * 2, y + padding * 2 + 80);
      ctx.stroke();

      // draw graph
      const graphWidth = serverListCellWidth - padding * 4;
      const graphHeight = 70;

      const graphX = x + padding * 2;
      const graphY = y + padding * 2 + 90;

      const leftTimestamp = Date.now() - 1000 * 60 * 60;
      const rightTimestamp = Date.now();

      const bottomPlayers = 0;
      const topPlayers = server.maxPlayers;

      const graphData = lastDay[server.identifier] || [];

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;

      graphData.forEach((data, i) => {
        const x = graphX + ((data.timestamp - leftTimestamp) / (rightTimestamp - leftTimestamp)) * graphWidth;
        const y =
          graphY +
          graphHeight -
          ((data.playerCount - bottomPlayers) / (topPlayers - bottomPlayers)) * graphHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });

    // bottom text
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Lato-Black";
    ctx.textAlign = "left";
    ctx.fillText(`Last updated at ${new Date().getHours() % 12 + 1}:${(new Date().getMinutes() + 1).toString().padStart(2, "0")} ${new Date().getHours() > 11 ? "PM" : "AM"} GMT`, padding, canvas.height - padding - 10);

    const attachments = [
      new AttachmentBuilder(canvas.toBuffer("image/png"), {
        name: "serverlist.png",
      }),
    ];

    ServerlistModule.getServerlistModule().persistantStorage.set("lastDay", lastDay);

    const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("credits")
        .setLabel("Credits")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("rosaclassic")
        .setLabel("RosaClassic")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel("View Serverlist")
        .setStyle(ButtonStyle.Link)
        .setURL("https://jpxs.international/live"),
    );



    const channel = (await ServerlistModule.getServerlistModule().bot.client.channels.fetch(
      channelId
    )) as GuildTextBasedChannel;

    if (!channel) return Logger.error("Channel not found");

    const message = messageId
      ? await channel.messages.fetch(messageId).catch(() => {
          // @ts-ignore
          ServerlistModule.getServerlistModule().persistantStorage.set("messageId", null);
        })
      : null;

    if (message && message.editable) {
      await message.edit({ files: attachments }).catch(async (err) => {
        Logger.error("EmbedGenerator", err);
        await channel.bulkDelete(100);
        const msg = await channel.send({ files: attachments, components: [buttons] });
        ServerlistModule.getServerlistModule().persistantStorage.set("messageId", msg.id);
      });
    } else {
      await channel.bulkDelete(100);
      const msg = await channel.send({ files: attachments, components: [buttons] });
      ServerlistModule.getServerlistModule().persistantStorage.set("messageId", msg.id);
    }

    servers.forEach((server) => {
      const lastDay = ServerlistModule.getServerlistModule().persistantStorage.get("lastDay") || {};
      const serverData = lastDay[server.identifier] || [];

      // don't keep more than 1 hour of data
      while (serverData.length > 0 && serverData[0].timestamp < Date.now() - 1000 * 60 * 60) {
        serverData.shift();
      }

      serverData.push({
        timestamp: Date.now(),
        playerCount: server.players,
      });
      lastDay[server.identifier] = serverData;
      ServerlistModule.getServerlistModule().persistantStorage.set("lastDay", lastDay);
    });

    let totalPlayers = 0;
    let totalServers = servers.length;

    servers.forEach((server) => {
      totalPlayers += server.players;
    });

    bot.client.user?.setActivity({
      type: ActivityType.Playing,
      name: `Sub Rosa; ${totalPlayers} players on ${totalServers} servers`,
    })

    Logger.info("EmbedGenerator", "Updated serverlist");
  }
}
