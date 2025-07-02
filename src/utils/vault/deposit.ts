import { VAULT_ABI } from "./vault.abi";
import { DepositParams } from "./types";

export default async function deposit(params: DepositParams) {
  const { request } = await params.client.simulateContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "deposit",
    args: [params.depositStruct, params.proof],
  });
  const txHash = await params.client.writeContract(request);
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
