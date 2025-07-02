export const WITHDRAW_EXTENSION_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "vault_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "sValue",
            type: "bytes32",
          },
        ],
        internalType: "struct WithdrawItem[]",
        name: "items",
        type: "tuple[]",
      },
    ],
    name: "withdrawBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
