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
    serverlist: {
        ip: string;
        color: string;
        icon: string;
    }[];
    lastDay: {
      [serverIp: string]: {
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
    
    return true;
  }

  public static getServerlistModule() {
    return bot.moduleLoader.getModuleForced<ServerlistModule>("serverlist");
  }
}
