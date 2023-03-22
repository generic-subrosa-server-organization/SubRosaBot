import { AttachmentBuilder, ColorResolvable, EmbedBuilder, GuildTextBasedChannel } from "discord.js";
import ServerlistModule from ".";
import fetch from "node-fetch";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import { ms } from "../../core/utils/time";
import Logger from "../../core/utils/logger";

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
    const serverlist = ServerlistModule.getServerlistModule().persistantStorage.get("serverlist");
    const lastDay = ServerlistModule.getServerlistModule().persistantStorage.get("lastDay");

    if (!channelId || !messageId || !serverlist || !lastDay) {
      Logger.error("EmbedGenerator", "Serverlist not configured");

      const s = ServerlistModule.getServerlistModule().persistantStorage;

      s.set("channelId", "channelId");
      s.set("messageId", "messageId");
      s.set("serverlist", []);
      s.set("lastDay", {});
    }

    const servers = await fetch("https://jpxs.international/api/servers").then((res) =>
      res.json().then((json) => json.servers as Server[])
    );

    const embeds: EmbedBuilder[] = [];
    const attachments: AttachmentBuilder[] = [];

    const promises = serverlist.map(async (serverListData, index) => {
      const serverIp = serverListData.ip;
      let serverData = lastDay[serverIp];

      const icon = await loadImage(serverListData.icon);
      const [ip, port] = serverIp.split(":");
      const server = servers.find((server) => server.address === ip && server.port === parseInt(port));

      if (!server) return Logger.error("EmbedGenerator", `Server ${serverIp} not found`);

      const embed = new EmbedBuilder();

      const canvas = createCanvas(700, 500);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, 700, 500);

      ctx.drawImage(icon, 610, 10, 80, 80);

      ctx.fillStyle = "#fff";
      ctx.font = `50px ${fonts.Italic}`;
      ctx.fillText(server.name, 10, 50);

      ctx.font = `30px ${fonts.Black}`;
      ctx.fillText(`Players: ${server.players}/${server.maxPlayers}`, 10, 100);

      const playerCountLineLength = ctx.measureText(`Players: ${server.players}/${server.maxPlayers}`).width;

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";

      // fill bar based on player count
      ctx.fillStyle = "#fff";
      ctx.strokeRect(playerCountLineLength + 50, 70, 500 - playerCountLineLength, 30);
      ctx.fillRect(
        playerCountLineLength + 50,
        70,
        (500 - playerCountLineLength) * (server.players / server.maxPlayers),
        30
      );

      // graph border

      ctx.strokeRect(10, 110, 680, 380);

      // graph
      const farLeftTimestamp = Date.now() - ms("1 h");
      const farRightTimestamp = Date.now();

      const farLeftX = 10;
      const farRightX = 690;

      const topY = 110;
      const bottomY = 490;

      const graphWidth = farRightX - farLeftX;
      const graphHeight = bottomY - topY;

      const graphData = serverData.map((data, index) => ({
        x:
          farLeftX +
          ((data.timestamp - farLeftTimestamp) / (farRightTimestamp - farLeftTimestamp)) * graphWidth,
        y: bottomY - (data.playerCount / server.maxPlayers) * graphHeight,
        playerCount: data.playerCount,
        index,
      }));

      ctx.beginPath();
      ctx.moveTo(graphData[0].x, graphData[0].y);

      let bullets: { x: number; y: number }[] = [];

      graphData.forEach((data, index) => {
        ctx.lineTo(data.x, data.y);

        if (index % 10 === 0 && index > 2) {
          // draw player count text

          let drawHigher = false;

          // if the next or previous data point would would intersect with the text, draw it higher up
          if (
            (graphData[index + 1] && graphData[index + 1].x - data.x < 2) ||
            (graphData[index - 1] && data.x - graphData[index - 1].x < 2)
          )
            drawHigher = true;

          ctx.fillStyle = "#fff";
          ctx.font = `20px ${fonts.Light}`;
          const text = ctx.measureText(`${data.playerCount}`);
          ctx.fillText(`${data.playerCount}`, data.x - text.width / 2, data.y - (drawHigher ? -20 : 10));

          // add bullet to array
          bullets.push({ x: data.x, y: data.y });
        }
      });

      ctx.stroke();

      // draw bullets
      bullets.forEach((bullet) => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // add peak player count, and lowest player count

      const peakPlayerCount = Math.max(...serverData.slice(3).map((data) => data.playerCount));
      const lowestPlayerCount = Math.min(...serverData.slice(3).map((data) => data.playerCount));

      const peakPlayerCountData = graphData.find((data) => data.playerCount === peakPlayerCount);

      if (peakPlayerCountData) {
        ctx.fillStyle = "#0f0";
        ctx.font = `20px ${fonts.Light}`;
        const peakPlayerCountText = ctx.measureText(`${peakPlayerCount}`);
        ctx.fillText(
          `${peakPlayerCount}`,
          peakPlayerCountData.x - peakPlayerCountText.width / 2,
          peakPlayerCountData.y - 10
        );

        // draw bullet
        ctx.beginPath();
        ctx.arc(peakPlayerCountData.x, peakPlayerCountData.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      const lowestPlayerCountData = graphData.find((data) => data.playerCount === lowestPlayerCount);

      if (lowestPlayerCountData) {
        ctx.fillStyle = "#f00";
        ctx.font = `20px ${fonts.Light}`;
        const lowestPlayerCountText = ctx.measureText(`${lowestPlayerCount}`);
        ctx.fillText(
          `${lowestPlayerCount}`,
          lowestPlayerCountData.x - lowestPlayerCountText.width / 2,
          lowestPlayerCountData.y + 30
        );

        // draw bullet
        ctx.beginPath();
        ctx.arc(lowestPlayerCountData.x, lowestPlayerCountData.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      const buf = canvas.toBuffer("image/png");
      const attachment = new AttachmentBuilder(buf, {
        name: `server${index}.png`,
      });

      embed.setImage(`attachment://server${index}.png`);
      attachments.push(attachment);

      embed.setFooter({
        text: `Graph shows last 1 hour of player count | Data provided by jpxs.international`,
      });

      embed.setColor(serverListData.color as ColorResolvable);

      if (!serverData) serverData = [];

      // only keep last 1 hour of data
      serverData = serverData.filter((data) => data.timestamp > Date.now() - ms("1 h"));

      serverData.push({
        timestamp: Date.now(),
        playerCount: server.players,
      });

      lastDay[serverIp] = serverData;

      embeds.push(embed);
    });

    await Promise.all(promises);

    ServerlistModule.getServerlistModule().persistantStorage.set("lastDay", lastDay);

    const channel = (await ServerlistModule.getServerlistModule().bot.client.channels.fetch(
      channelId
    )) as GuildTextBasedChannel;

    if (!channel) return Logger.error("Channel not found");

    const message = await channel.messages.fetch(messageId);

    if (message && message.editable) {
      
      await message.edit({ embeds: embeds, files: attachments }).catch(async (err) => {

        Logger.error("EmbedGenerator", err);
        await channel.bulkDelete(100);
        const msg = await channel.send({ embeds: embeds, files: attachments });
        ServerlistModule.getServerlistModule().persistantStorage.set("messageId", msg.id);
        
      });

    } else {

      await channel.bulkDelete(100);
      const msg = await channel.send({ embeds: embeds, files: attachments });
      ServerlistModule.getServerlistModule().persistantStorage.set("messageId", msg.id);

    }

    Logger.info("EmbedGenerator", "Updated serverlist");
  }
}
