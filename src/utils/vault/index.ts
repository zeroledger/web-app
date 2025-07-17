export { default as deposit } from "./deposit";
export { default as prepareDeposit } from "./prepareDeposit";
export { getRegistry, isUserRegistered } from "./registry";
export { default as prepareSpend } from "./prepareSpend";
export { default as spend } from "./spend";
export { default as withdraw } from "./withdraw";
export { watchVault, getMissedEvents } from "./watcher";
export { encode, decodeMetadata, decryptCommitment } from "./metadata";
export * from "./types";
