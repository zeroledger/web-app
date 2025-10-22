export const VAULT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "authority",
        type: "address",
      },
    ],
    name: "AccessManagedInvalidAuthority",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "delay",
        type: "uint32",
      },
    ],
    name: "AccessManagedRequiredDelay",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    name: "AccessManagedUnauthorized",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "AddressEmptyCode",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "currentBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint240",
        name: "maxTVL",
        type: "uint240",
      },
    ],
    name: "AmountExceedsMaxTVL",
    type: "error",
  },
  {
    inputs: [],
    name: "AmountMustBeGreaterThanZero",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "poseidonHash",
        type: "uint256",
      },
    ],
    name: "CommitmentAlreadyUsed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "ERC1967InvalidImplementation",
    type: "error",
  },
  {
    inputs: [],
    name: "ERC1967NonPayable",
    type: "error",
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedCall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "poseidonHash",
        type: "uint256",
      },
    ],
    name: "InputCommitmentNotFound",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInitialization",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidZKProof",
    type: "error",
  },
  {
    inputs: [],
    name: "NoInputsProvided",
    type: "error",
  },
  {
    inputs: [],
    name: "NoOutputsProvided",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInitializing",
    type: "error",
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
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    name: "OnlyAssignedAddressCanWithdraw",
    type: "error",
  },
  {
    inputs: [],
    name: "PermitExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SafeERC20FailedOperation",
    type: "error",
  },
  {
    inputs: [],
    name: "UUPSUnauthorizedCallContext",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "slot",
        type: "bytes32",
      },
    ],
    name: "UUPSUnsupportedProxiableUUID",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "totalProvided",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalRequested",
        type: "uint256",
      },
      {
        internalType: "uint240",
        name: "fee",
        type: "uint240",
      },
    ],
    name: "UnequalTotalAmounts",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "authority",
        type: "address",
      },
    ],
    name: "AuthorityUpdated",
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
        internalType: "uint256",
        name: "poseidonHash",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "metadata",
        type: "bytes",
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
        indexed: false,
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
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
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
        name: "poseidonHash",
        type: "uint256",
      },
    ],
    name: "CommitmentTransfer",
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
        indexed: true,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
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
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
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
    ],
    name: "Spend",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
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
        indexed: true,
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "UPGRADE_INTERFACE_VERSION",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "authority",
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
            internalType: "uint240",
            name: "amount",
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
            name: "depositCommitmentParams",
            type: "tuple[3]",
          },
          {
            internalType: "uint240",
            name: "forwarderFee",
            type: "uint240",
          },
          {
            internalType: "address",
            name: "forwarderFeeRecipient",
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
    inputs: [
      {
        components: [
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
            name: "depositCommitmentParams",
            type: "tuple[3]",
          },
          {
            internalType: "uint240",
            name: "forwarderFee",
            type: "uint240",
          },
          {
            internalType: "address",
            name: "forwarderFeeRecipient",
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
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "depositWithPermit",
    outputs: [],
    stateMutability: "nonpayable",
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
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getManager",
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
    inputs: [],
    name: "getTrustedForwarder",
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
    inputs: [],
    name: "getVerifiers",
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
        name: "verifiers",
        type: "address",
      },
      {
        internalType: "address",
        name: "trustedForwarder",
        type: "address",
      },
      {
        internalType: "address",
        name: "protocolManager",
        type: "address",
      },
      {
        internalType: "address",
        name: "initialAuthority",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isConsumingScheduledOp",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "forwarder",
        type: "address",
      },
    ],
    name: "isTrustedForwarder",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newAuthority",
        type: "address",
      },
    ],
    name: "setAuthority",
    outputs: [],
    stateMutability: "nonpayable",
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
            name: "metadata",
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
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
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
            name: "metadata",
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
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "spendAndCall",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
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
    name: "transfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "upgradeCallBack",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
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
            internalType: "uint240",
            name: "amount",
            type: "uint240",
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
        components: [
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "uint240",
            name: "amount",
            type: "uint240",
          },
        ],
        internalType: "struct WithdrawRecipient[]",
        name: "recipients",
        type: "tuple[]",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const VAULT_ABI_EVENTS = VAULT_ABI.filter(
  (item) => item.type === "event",
);

export const COMMITMENT_ABI = [
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
] as const;

export const ENCRYPTION_ABI = [
  {
    internalType: "bytes",
    name: "encryptedCommitment",
    type: "bytes",
  },
  {
    internalType: "string",
    name: "tesUrl",
    type: "string",
  },
  {
    internalType: "string",
    name: "message",
    type: "string",
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
