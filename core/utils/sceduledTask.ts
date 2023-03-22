import parser from "cron-parser";

export default class ScheduledTask {
  public timeout?: NodeJS.Timeout;

  constructor(public cronline: string, public callback: () => void | Promise<void>) {
    this.run();
  }

  run() {
    let interval = parser.parseExpression(this.cronline);
    let next = interval.next().toDate();

    this.timeout = setTimeout(() => {
      this.callback();
      this.run();
    }, next.getTime() - Date.now());
  }

  delete() {
    if (this.timeout) clearTimeout(this.timeout);
  }

  runNow() {
    this.callback();
  }

  static create(cronline: string, callback: () => void | Promise<void>) {
    return new ScheduledTask(cronline, callback);
  }
}
