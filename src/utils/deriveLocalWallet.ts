import { keccak256, type Hex, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { signTypedData } from "@src/utils/signTypedData";
import { type CustomClient } from "@src/services/Clients";

const localAccountDomain = {
  name: "Local Account Derivation",
  version: "0.0.1",
} as const;

const localAccountTypes = {
  Derive: [
    { name: "protocol", type: "string" },
    { name: "rootWallet", type: "address" },
  ],
} as const;

/**
 * Derives a local wallet from an embedded wallet signature.
 * The local wallet is deterministic and can be recreated from the embedded wallet.
 *
 * @param embeddedClient - The embedded wallet client
 * @param embeddedWalletAddress - The embedded wallet address
 * @returns The derived local wallet account
 */
export async function deriveLocalAccount(
  embeddedClient: CustomClient,
  embeddedWalletAddress: Address,
) {
  const obj = {
    domain: localAccountDomain,
    types: localAccountTypes,
    primaryType: "Derive" as const,
    message: {
      protocol: "zeroledger",
      rootWallet: embeddedWalletAddress,
    },
  };

  // Sign with embedded wallet
  const signature = (await signTypedData(embeddedClient, obj)) as Hex;

  // Derive private key from signature
  const privateKey = keccak256(signature);

  // Create local wallet account
  const localAccount = privateKeyToAccount(privateKey);

  return localAccount;
}
