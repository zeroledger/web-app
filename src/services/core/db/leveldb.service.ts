/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { BrowserLevel } from "browser-level";
import { getEntityKey } from "./leveldb.utils";

export class DataSource {
  readonly db: BrowserLevel;

  constructor(appPrefix: string) {
    this.db = new BrowserLevel(`${appPrefix}.source.${import.meta.env.MODE}`, {
      valueEncoding: "utf8",
    });
  }

  getEntityLevel(entity: Function | { name: string }) {
    return this.db.sublevel(getEntityKey(entity));
  }

  clear() {
    return this.db.clear();
  }
}
