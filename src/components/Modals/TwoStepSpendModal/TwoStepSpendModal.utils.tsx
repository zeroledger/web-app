import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { shortString } from "@src/utils/common";
import { toHex, formatUnits, Address } from "viem";
import { type TransactionDetails } from "@src/services/ledger";

export const prepareSigningData = (
  metaTransaction?: UnsignedMetaTransaction,
) => {
  if (!metaTransaction) return [];
  return [
    {
      label: "Vault Contract",
      value: shortString(metaTransaction.to),
    },
    {
      label: "Gas",
      value: `${metaTransaction.gas.toString()} wei`,
    },
    { label: "Nonce", value: toHex(metaTransaction.nonce) },
    {
      label: "Deadline",
      value: new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      }).format(new Date(parseInt(metaTransaction.deadline.toString()) * 1000)),
    },
    {
      label: "User Transaction",
      value: (
        <a
          href={`https://calldata.swiss-knife.xyz/decoder?calldata=${metaTransaction.data}`}
          target="_blank"
          rel="noopener noreferrer"
          className=" text-gray-300 hover:text-gray-200 transition-colors underline"
        >
          {shortString(metaTransaction.data)}
        </a>
      ),
    },
  ];
};

export const formatTransactionDetailsType = (
  type: TransactionDetails["type"],
) => {
  switch (type) {
    case "deposit":
      return "Deposit";
    case "partialWithdraw":
      return "Partial Withdraw";
    case "withdraw":
      return "Withdraw";
    case "send":
      return "Send";
  }
};

export const prepareMinimalTransactionDetails = (
  transactionDetails?: TransactionDetails,
  protocolFee?: bigint,
  paymasterFee?: bigint,
  decimals?: number,
) => {
  if (
    !transactionDetails ||
    protocolFee === undefined ||
    paymasterFee === undefined
  )
    return [];
  return [
    {
      label: "Recipient",
      value: shortString(transactionDetails.to),
    },
    {
      label: "Value",
      value: `$${formatUnits(transactionDetails.value, decimals || 18)}`,
    },
    {
      label: "Paymaster Fee",
      value: `$${formatUnits(paymasterFee, decimals || 18)}`,
    },
    {
      label: `Protocol Fee`,
      value: `$${formatUnits(protocolFee, decimals || 18)}`,
    },
  ];
};

export const prepareFullTransactionDetails = (
  transactionDetails?: TransactionDetails,
  paymasterAddress?: Address,
) => {
  if (!transactionDetails || !paymasterAddress) return [];
  return [
    {
      label: "Type",
      value: formatTransactionDetailsType(transactionDetails.type),
    },
    {
      label: "Forwarder Contract",
      value: shortString(transactionDetails.forwarder),
    },
    {
      label: "Token",
      value: shortString(transactionDetails.token),
    },
    {
      label: "From",
      value: shortString(transactionDetails.from),
    },
    {
      label: "Inputs",
      value: (
        <>
          {transactionDetails.inputs.map((input) => (
            <div key={input}>{shortString(input.toString())}</div>
          ))}
        </>
      ),
    },
    {
      label: "Outputs",
      value: (
        <>
          {transactionDetails.outputs.map((output) => (
            <div key={output}>{shortString(output.toString())}</div>
          ))}
        </>
      ),
    },
    {
      label: "Paymaster",
      value: shortString(paymasterAddress),
    },
  ];
};
