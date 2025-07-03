import { VAULT_ABI } from "./vault.abi";
import { SpendParams } from "./types";

export default async function spend(params: SpendParams) {
  const { request } = await params.client.simulateContract({
    address: params.contract,
    abi: VAULT_ABI,
    functionName: "spend",
    args: [params.transactionStruct, params.proof],
  });
  const txHash = await params.client.writeContract(request);
  const receipt = await params.client.waitForTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}
