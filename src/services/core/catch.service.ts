import { EventEmitter } from "node:events";

export const CatchServiceEvents = {
  ERROR: "ERROR",
  WARN: "WARN",
};

class CatchService extends EventEmitter {
  catch(e: Error) {
    console.error(e);
    this.emit(CatchServiceEvents.ERROR, e.message);
  }
  catchWarn(e: Error) {
    console.warn(e);
    this.emit(CatchServiceEvents.WARN, e.message);
  }
}

export const catchService = new CatchService();
