/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { BrowserLevel } from "browser-level";
import { getEntityKey } from "./leveldb.utils";

export class DataSource {
  readonly db: BrowserLevel;

  constructor() {
    this.db = new BrowserLevel(`pryx.${import.meta.env.MODE}`, {
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
