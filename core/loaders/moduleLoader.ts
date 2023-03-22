import fs from "fs";
import path from "path";
import Bot from "../bot";
import Module from "../base/module";
import { CustomCommandBuilder, Manifest } from "./loaderTypes";
import { GatewayIntentsString } from "discord.js";
import Logger from "../utils/logger";
import { usage } from "../utils/usage";

export default class ModuleLoader {
  public modules: Map<string, Module<any>> = new Map();

  constructor(private bot: Bot) {
    this.loadModules();
  }

  public addModule(module: Module<any>) {
    this.modules.set(module.name, module);
  }

  public getModule<M extends Module<any, any> = Module<any, any>>(name: string): M | undefined {
    return this.modules.get(name) as M;
  }

  public getModuleForced<M extends Module<any, any> = Module<any, any>>(name: string): M {
    const module = this.getModule(name);
    if (!module) throw new Error(`Module ${name} not found!`);
    return module as M;
  }

  public loadModules() {
    const modulesPath = path.join(__dirname, "../../modules");
    const modules = fs.readdirSync(modulesPath);

    for (const mod of modules) {
      const modulePath = path.join(modulesPath, mod);
      const moduleFile = require(modulePath);
      const m = new moduleFile.default(this.bot);
      this.addModule(m);
    }

    Logger.log("ModuleLoader","Loaded modules: " + this.modules.size);
    usage.data.modules = this.modules.size;
    usage.data.moduleList = Array.from(this.modules.keys()).join(", ");

    this.bot.loadStatus.modules = true;

    //load commands on ready

    this.bot.client.once("ready", async () => {
      const promises: Promise<CustomCommandBuilder[]>[] = [];
      this.modules.forEach(async (module) => {
        promises.push(
          new Promise(async (resolve) => {
            const moduleCommands = await module.loadCommands();
            resolve(moduleCommands);
          })
        );
      });

      const commands: CustomCommandBuilder[] = [];
      (await Promise.all(promises)).forEach((moduleCommands) => {
        commands.push(...moduleCommands);
      });

      await this.bot.commandLoader.load(commands);
      this.bot.loadStatus.commands = true;

      this.bot.updateLoadStatus();

      this.bot.configLoader.loadConfig();
    });
  }

  public getAllModules(): Module<any>[] {
    const modulesPath = path.join(__dirname, "../../modules");
    const modules = fs.readdirSync(modulesPath);

    const moduleObjects: Module<any>[] = [];
    for (const mod of modules) {
      const modulePath = path.join(modulesPath, mod);
      const moduleFile = require(modulePath);
      const m = new moduleFile.default(this.bot);

      moduleObjects.push(m);
    }
    return moduleObjects;
  }

  public getLoadedModules(): Module<any>[] {
    return Array.from(this.modules.values());
  }

  public getUnloadedModules(): Module<any>[] {
    const loadedModules = this.getLoadedModules();
    const allModules = this.getAllModules();

    const unloadedModules: Module<any>[] = [];
    allModules.forEach((module) => {
      if (!loadedModules.includes(module)) unloadedModules.push(module);
    });

    return unloadedModules;
  }

  public getModuleCommands(moduleName: string): CustomCommandBuilder[] {
    return Array.from(
      this.bot.commandLoader.commands.filter((command) => command.getModule() === moduleName).values()
    );
  }

  public isModuleLoaded(moduleName: string): boolean {
    return this.modules.has(moduleName);
  }

  public async loadModule(moduleName: string): Promise<boolean> {
    if (this.isModuleLoaded(moduleName)) return false;

    const modulePath = path.join(__dirname, "../../modules", moduleName);
    const moduleFile = require(modulePath);
    const m = new moduleFile.default(this.bot);
    this.addModule(m);

    const moduleCommands = await m.loadCommands();
    this.bot.commandLoader.load(moduleCommands);

    return true;
  }

  public async unloadModule(moduleName: string): Promise<boolean> {
    if (!this.isModuleLoaded(moduleName)) return false;

    const module = this.getModule(moduleName);
    if (!module) return false;

    const moduleCommands = this.getModuleCommands(moduleName);
    this.bot.commandLoader.unload(moduleCommands);

    this.modules.delete(moduleName);

    return true;
  }

  public async onReady() {
    const promises: Promise<{
      module: Module<any>;
      success: boolean;
    }>[] = [];
    this.modules.forEach(async (module) => {
      promises.push(
        new Promise(async (resolve) => {
          const res = await module.onLoad();
          resolve({
            module,
            success: res,
          });
        })
      );
    });

    (await Promise.all(promises)).forEach((res) => {
      if (!res.success) Logger.error("ModuleLoader", `Failed to load module ${res.module.name}`);
    });
  }

  public static getIntents(): GatewayIntentsString[] {
    const modules = fs.readdirSync(path.join(__dirname, "../../../modules"));
    const intents = new Set<string>();

    for (const mod of modules) {
      const modulePath = path.join(__dirname, "../../../modules", mod);
      const manifest = JSON.parse(fs.readFileSync(path.join(modulePath, "manifest.json"), "utf-8"));
      if (manifest.intents) {
        manifest.intents.forEach((intent: string) => {
          intents.add(intent);
        });
      }
    }

    Logger.log("ModuleLoader","Loaded intents: " + Array.from(intents.values()).join(", "));

    return Array.from(intents) as GatewayIntentsString[];
  }
}
