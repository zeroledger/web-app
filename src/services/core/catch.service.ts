import { EventEmitter } from "node:events";

class CatchService extends EventEmitter {
  catch(e: Error) {
    console.error(e);
    this.emit("errorNotification", e.message);
  }
}

export const catchService = new CatchService();
