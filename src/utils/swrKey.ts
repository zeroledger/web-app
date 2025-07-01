import { type CustomClient } from "@src/common.types";

export const swrKeyForClient = (client?: CustomClient) =>
  client ? `${client.account.address}:${client.chain.id}` : "client";
