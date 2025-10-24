/* eslint-disable @typescript-eslint/no-explicit-any */

let level: 0 | 1 | 2 | 3;

switch (import.meta.env.VITE_LOG_LVL) {
  case "log":
    level = 2;
    break;
  case "warn":
    level = 1;
    break;
  case "error":
    level = 0;
    break;
  default:
    level = import.meta.env.VITE_PROD ? 1 : 3;
    break;
}

console.log("[zeroledger-app] log level", level);

export class Logger {
  constructor(private readonly instanceContext?: string) {}

  log(message: any, context?: string) {
    Logger.log(message, context ?? this.instanceContext ?? "");
  }
  warn(message: any, context?: string) {
    Logger.warn(message, context ?? this.instanceContext ?? "");
  }
  error(message: any, context?: string) {
    Logger.error(message, context ?? this.instanceContext ?? "");
  }

  static log(message: any, context?: string) {
    if (level >= 2) {
      console.log(`[zeroledger-app] [${context}] ${message}`);
    }
  }
  static warn(message: any, context?: string) {
    if (level >= 1) {
      console.warn(`[zeroledger-app] [${context}] ${message}`);
    }
  }
  static error(message: any, context?: string) {
    if (level >= 0) {
      console.error(`[zeroledger-app] [${context}] ${message}`);
    }
  }
}
