export class ConfigOption<T> {
  private module: string;
  private id: string;
  private default: T;
  private value?: T;

  constructor(module: string, id: string, defaultValue: T, value?: T) {
    this.module = module;
    this.id = id;
    this.default = defaultValue;
    this.value = value;
  }

  public get(): T {
    return this.value ?? this.default;
  }

  public set(value: T): void {
    this.value = value;
  }

    public reset(): void {
        this.value = undefined;
    }

    public getId(): string {
        return `${this.module}.${this.id}`;
    }

    public getDefault(): T {
        return this.default;
    }

    public getModule(): string {
        return this.module;
    }

}
