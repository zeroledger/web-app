import { EventEmitter } from "node:events";

class CatchService extends EventEmitter {
  catch(e: Error) {
    console.error(`Error: ${e.message}`);
    this.emit("errorNotification", e.message);
  }
}

export const catchService = new CatchService();
