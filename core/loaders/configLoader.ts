import fs from "fs";
import path from "path";
import { db } from "..";
import { ConfigOption } from "./objects/configOption";

export default class ConfigLoader {
    public static readonly configPath = path.resolve("config.json");
  public config: Map<string, ConfigOption<unknown>> = new Map();

  public onModuleLoad(module: string, defaultConfig: any): void {
    for (const [id, value] of Object.entries(defaultConfig)) {
      this.registerConfig(module, id, value);
    }
  }

  public registerConfig<T>(module: string, id: string, defaultValue: T, value?: T) {
    this.config.set(`${module}.${id}`, new ConfigOption<T>(module, id, defaultValue, value));
  }

  public getConfig<T>(module: string, id: string): ConfigOption<T> {
    return this.config.get(`${module}.${id}`) as ConfigOption<T>;
  }

  public getConfigValue<T>(module: string, id: string): T {
    return this.getConfig<T>(module, id).get();
  }

  public setConfigValue<T>(module: string, id: string, value: T): void {
    this.getConfig<T>(module, id).set(value);
  }

  public resetConfigValue<T>(module: string, id: string): void {
    this.getConfig<T>(module, id).reset();
  }

  public getConfigsByModule(module: string): ConfigOption<unknown>[] {
    return Array.from(this.config.values()).filter((config) => config.getModule() === module);
  }

  public loadConfig(): void {



  }

  public async saveConfig(): Promise<void> {
    const repo = db.getEntityManager().getRepository(ConfigOption);
    const configs = await repo.findAll();

    for (const config of configs) {
      const configOption = this.config.get(config.getId());
      if (!configOption) continue;
      config.set(configOption.get());
    }

    await repo.persistAndFlush(configs);
  }
}
