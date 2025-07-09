export const VAULT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_depositVerifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spend11Verifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spend12Verifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spend13Verifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spend21Verifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spend22Verifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spend23Verifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spend31Verifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spend32Verifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spend161Verifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_encryptionRegistry",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
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
        name: "poseidonHash",
        type: "uint256",
      },
    ],
    name: "CommitmentCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
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
        name: "poseidonHash",
        type: "uint256",
      },
    ],
    name: "CommitmentRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "poseidonHash",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "bytes",
        name: "encryptedData",
        type: "bytes",
      },
    ],
    name: "EncryptedMetadata",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "total_deposit_amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
    ],
    name: "TokenDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "inputHashes",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "outputHashes",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
    ],
    name: "TransactionSpent",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "commitmentsMap",
    outputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "bool",
        name: "locked",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "sValue",
        type: "uint256",
      },
    ],
    name: "computePoseidonHash",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "total_deposit_amount",
            type: "uint256",
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
                name: "encryptedData",
                type: "bytes",
              },
            ],
            internalType: "struct DepositCommitmentParams[3]",
            name: "depositCommitmentParams",
            type: "tuple[3]",
          },
          {
            internalType: "uint256",
            name: "fee",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "feeRecipient",
            type: "address",
          },
        ],
        internalType: "struct DepositParams",
        name: "depositParams",
        type: "tuple",
      },
      {
        internalType: "uint256[24]",
        name: "proof",
        type: "uint256[24]",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "depositVerifier",
    outputs: [
      {
        internalType: "contract DepositVerifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "encryptionRegistry",
    outputs: [
      {
        internalType: "contract EncryptionRegistry",
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
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "poseidonHash",
        type: "uint256",
      },
    ],
    name: "getCommitment",
    outputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "bool",
        name: "locked",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "uint256[]",
            name: "inputsPoseidonHashes",
            type: "uint256[]",
          },
          {
            internalType: "uint256[]",
            name: "outputsPoseidonHashes",
            type: "uint256[]",
          },
          {
            internalType: "bytes[]",
            name: "encryptedData",
            type: "bytes[]",
          },
          {
            components: [
              {
                internalType: "address",
                name: "owner",
                type: "address",
              },
              {
                internalType: "uint8[]",
                name: "indexes",
                type: "uint8[]",
              },
            ],
            internalType: "struct OutputsOwners[]",
            name: "outputsOwners",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "address",
                name: "owner",
                type: "address",
              },
              {
                internalType: "uint240",
                name: "amount",
                type: "uint240",
              },
            ],
            internalType: "struct PublicOutput[]",
            name: "publicOutputs",
            type: "tuple[]",
          },
        ],
        internalType: "struct Transaction",
        name: "transaction",
        type: "tuple",
      },
      {
        internalType: "uint256[24]",
        name: "proof",
        type: "uint256[24]",
      },
    ],
    name: "spend",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "spend11Verifier",
    outputs: [
      {
        internalType: "contract Spend11Verifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "spend12Verifier",
    outputs: [
      {
        internalType: "contract Spend12Verifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "spend13Verifier",
    outputs: [
      {
        internalType: "contract Spend13Verifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "spend161Verifier",
    outputs: [
      {
        internalType: "contract Spend161Verifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "spend21Verifier",
    outputs: [
      {
        internalType: "contract Spend21Verifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "spend22Verifier",
    outputs: [
      {
        internalType: "contract Spend22Verifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "spend23Verifier",
    outputs: [
      {
        internalType: "contract Spend23Verifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "spend31Verifier",
    outputs: [
      {
        internalType: "contract Spend31Verifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "spend32Verifier",
    outputs: [
      {
        internalType: "contract Spend32Verifier",
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
            internalType: "uint256",
            name: "sValue",
            type: "uint256",
          },
        ],
        internalType: "struct WithdrawItem[]",
        name: "items",
        type: "tuple[]",
      },
      {
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "feeRecipient",
        type: "address",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const REGISTRY_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "encryptionPubKey",
        type: "bytes",
      },
    ],
    name: "EncryptionPubKeySet",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "encryptionPubKeys",
    outputs: [
      {
        internalType: "bytes",
        name: "pubKey",
        type: "bytes",
      },
      {
        internalType: "bool",
        name: "active",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getEncryptionPubKey",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "encryptionPubKey",
        type: "bytes",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
