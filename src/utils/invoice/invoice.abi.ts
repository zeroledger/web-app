export const INVOICE_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "InvalidInitialization",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInitializing",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "vault",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "InvoiceProcessed",
    type: "event",
  },
  {
    inputs: [],
    name: "factory",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "paramsHash_",
        type: "bytes32",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "vault",
        type: "address",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint240",
        name: "amount",
        type: "uint240",
      },
      {
        internalType: "uint240",
        name: "executionFee",
        type: "uint240",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "poseidonHash",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "metadata",
            type: "bytes",
          },
        ],
        internalType: "struct DepositCommitmentParams[3]",
        name: "commitmentParams",
        type: "tuple[3]",
      },
      {
        internalType: "uint256[24]",
        name: "proof",
        type: "uint256[24]",
      },
      {
        internalType: "address",
        name: "executor",
        type: "address",
      },
    ],
    name: "processInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const INVOICE_FACTORY_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "FailedDeployment",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "InsufficientBalance",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "invoiceAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "paramsHash",
        type: "bytes32",
      },
    ],
    name: "InvoiceDeployed",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "paramsHash",
        type: "bytes32",
      },
    ],
    name: "computeInvoiceAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "vault",
        type: "address",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint240",
        name: "amount",
        type: "uint240",
      },
      {
        internalType: "uint240",
        name: "executionFee",
        type: "uint240",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "poseidonHash",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "metadata",
            type: "bytes",
          },
        ],
        internalType: "struct DepositCommitmentParams[3]",
        name: "commitmentParams",
        type: "tuple[3]",
      },
      {
        internalType: "address",
        name: "executor",
        type: "address",
      },
    ],
    name: "computeParamsHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "vault",
        type: "address",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint240",
        name: "amount",
        type: "uint240",
      },
      {
        internalType: "uint240",
        name: "executionFee",
        type: "uint240",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "poseidonHash",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "metadata",
            type: "bytes",
          },
        ],
        internalType: "struct DepositCommitmentParams[3]",
        name: "commitmentParams",
        type: "tuple[3]",
      },
      {
        internalType: "uint256[24]",
        name: "proof",
        type: "uint256[24]",
      },
      {
        internalType: "address",
        name: "executor",
        type: "address",
      },
    ],
    name: "deployAndProcessInvoice",
    outputs: [
      {
        internalType: "address",
        name: "invoiceAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "paramsHash",
        type: "bytes32",
      },
    ],
    name: "deployInvoice",
    outputs: [
      {
        internalType: "address",
        name: "invoiceAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "invoiceImplementation",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const INVOICE_ABI_EVENTS = INVOICE_ABI.filter(
  (item) => item.type === "event",
);

export const INVOICE_FACTORY_ABI_EVENTS = INVOICE_FACTORY_ABI.filter(
  (item) => item.type === "event",
);

export const HASH_PARAMS_ABI = [
  {
    internalType: "address",
    name: "vault",
    type: "address",
  },
  {
    internalType: "address",
    name: "token",
    type: "address",
  },
  {
    internalType: "uint240",
    name: "amount",
    type: "uint240",
  },
  {
    internalType: "uint240",
    name: "executionFee",
    type: "uint240",
  },
  {
    components: [
      {
        internalType: "uint256",
        name: "poseidonHash",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "metadata",
        type: "bytes",
      },
    ],
    internalType: "struct DepositCommitmentParams[3]",
    name: "commitmentParams",
    type: "tuple[3]",
  },
  {
    internalType: "address",
    name: "executor",
    type: "address",
  },
] as const;
