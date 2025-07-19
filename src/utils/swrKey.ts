import { type CustomClient } from "@src/services/core/evmClient.service";

export const swrKeyForClient = (client?: CustomClient) =>
  client ? `${client.account.address}:${client.chain.id}` : "client";
