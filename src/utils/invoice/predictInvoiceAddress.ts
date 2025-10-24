import { encodeAbiParameters, keccak256 } from "viem";
import { INVOICE_FACTORY_ABI, HASH_PARAMS_ABI } from "./invoice.abi";
import { DeployAndProcessInvoiceParams } from "./invoice.types";

function computeParamsHash(
  params: Omit<DeployAndProcessInvoiceParams, "proof">,
) {
  return keccak256(
    encodeAbiParameters(HASH_PARAMS_ABI, [
      params.vault,
      params.token,
      params.amount,
      params.executionFee,
      params.commitmentParams,
      params.paymaster,
    ]),
  );
}

export async function predictInvoiceAddress(
  params: Omit<DeployAndProcessInvoiceParams, "proof">,
) {
  return params.client.readContract({
    address: params.invoiceFactory,
    abi: INVOICE_FACTORY_ABI,
    functionName: "computeInvoiceAddress",
    args: [computeParamsHash(params)],
  });
}
