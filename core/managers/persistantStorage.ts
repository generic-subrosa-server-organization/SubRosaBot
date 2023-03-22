import fs from "fs";
import path from "path";

export default class PersistantStorage<T extends {
  [key: string]: any;
}> {
  public path: string;
  public data: T;

  constructor(public moduleName: string) {
    if (moduleName != "") {
      this.path = path.resolve(`core/data/persistantStorage/${moduleName}.json`);
      this.data = this.read();
    } else {
        this.path = "";
        this.data = {} as T;   
    }
  }

  public setName(name: string) {
    this.path = path.resolve(`core/data/persistantStorage/${name}.json`);
    this.moduleName = name;
    this.data = this.read();
  }

  public read(): T {
    this.checkName();
    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(path.dirname(this.path), { recursive: true });
      fs.writeFileSync(this.path, "{}");
      return {} as T;
    }

    return JSON.parse(fs.readFileSync(this.path, "utf-8"));
  }

  public write() {
    this.checkName();
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  public get<K extends keyof T>(key: K): T[K] {
    return this.data[key];
  }

  public set(key: keyof T, value: T[keyof T]) {
    this.checkName();
    this.data[key] = value;
    this.write();
  }

  private checkName() {
    if (this.moduleName == "") {
      throw new Error("No module name set for persistant storage! Set it with setName()");
    }
  }
}
