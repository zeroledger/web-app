import { type CustomClient } from "@src/services/Clients";

export const swrKeyForClient = (client?: CustomClient) =>
  client ? `${client.account.address}:${client.chain.id}` : "client";
