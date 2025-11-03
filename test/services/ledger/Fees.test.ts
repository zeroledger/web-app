import { Fees } from "@src/services/ledger/Fees";
import { EvmClients } from "@src/services/Clients";
import { type Tes } from "@src/services/Tes";
import { formatUnits } from "viem";
import { vi } from "vitest";

// Mock the heavy dependencies
vi.mock("@src/utils/vault", () => ({
  depositGasSponsoredLimit: vi.fn(() => 100000n),
  depositWithPermitGasSponsoredLimit: vi.fn(() => 120000n),
  withdrawGasSponsoredLimit: vi.fn(
    (items: number) => 150000n + BigInt(items * 10000),
  ),
  spendGasSponsoredLimit: vi.fn(() => 200000n),
  getProtocolManager: vi.fn(() => Promise.resolve("0xProtocolManager")),
}));

vi.mock("@src/utils/metatx", () => ({}));

vi.mock("@src/utils/protocolManager", () => ({
  getProtocolFees: vi.fn(() =>
    Promise.resolve({
      deposit: 1000000000000000000n, // 1 token
      withdraw: 2000000000000000000n, // 2 tokens
      spend: 500000000000000000n, // 0.5 tokens
    }),
  ),
  asyncProtocolManagerUtils: {
    getProtocolFees: vi.fn(() =>
      Promise.resolve({
        deposit: 1000000000000000000n, // 1 token
        withdraw: 2000000000000000000n, // 2 tokens
        spend: 500000000000000000n, // 0.5 tokens
      }),
    ),
  },
}));

vi.mock("@src/services/Tes", () => ({
  Tes: vi.fn().mockImplementation(() => ({
    quote: vi.fn(() =>
      Promise.resolve({
        gasPrice: 20000000000n, // 20 gwei
        paymasterAddress: "0xPaymaster",
        sponsoredVaultMethods: ["deposit", "withdraw"],
      }),
    ),
  })),
}));

vi.mock("@src/utils/common", () => ({
  roundToCents: vi.fn((value: bigint, decimals: number) => {
    const formatted = formatUnits(value, decimals);
    const rounded = Math.ceil(parseFloat(formatted) * 100) / 100;
    return rounded.toFixed(2);
  }),
}));

vi.mock("@src/utils/logger", () => ({
  Logger: vi.fn().mockImplementation(() => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe("Fees", () => {
  let fees: Fees;
  let mockEvmClients: EvmClients;
  let mockTesService: Tes;
  const mockVault = "0xVault" as const;
  const mockToken = "0xToken" as const;
  const mockAccount = "0xAccount" as const;

  beforeEach(() => {
    // Create mock EvmClients
    mockEvmClients = {
      readClient: {
        getBlockNumber: vi.fn(),
        readContract: vi.fn(),
        getCode: vi.fn(() => Promise.resolve(undefined)), // EOA has no bytecode
        multicall: vi.fn(() =>
          Promise.resolve([
            { status: "success", result: "TestToken" },
            { status: "success", result: 0n },
            { status: "success", result: ["", "", "", 0n, "", ""] },
          ]),
        ),
      },
      primaryClient: vi.fn(() => ({
        account: {
          address: mockAccount,
          sign: vi.fn(),
        },
        chain: { id: 1 },
        signTypedData: vi.fn(),
        multicall: vi.fn(() =>
          Promise.resolve([
            { status: "success", result: "TestToken" },
            { status: "success", result: 0n },
            { status: "success", result: ["", "", "", 0n, "", ""] },
          ]),
        ),
        readContract: vi.fn(),
      })),
    } as unknown as EvmClients;

    // Create mock Tes service
    mockTesService = {
      quote: vi.fn(() =>
        Promise.resolve({
          gasPrice: 20000000000n, // 20 gwei
          paymasterAddress: "0xPaymaster",
          sponsoredVaultMethods: ["deposit", "withdraw"],
        }),
      ),
      viewAccount: {
        getDelegationSignature: vi.fn(() => "0x1234567890abcdef"),
        getViewAccount: vi.fn(() => ({
          address: "0xViewAccount",
          signMessage: vi.fn(),
        })),
      },
    } as unknown as Tes;

    fees = new Fees(
      mockEvmClients,
      mockVault,
      mockToken,
      mockTesService,
      mockAccount,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getProtocolFees", () => {
    it("should return protocol fees", async () => {
      const protocolFees = await fees.getProtocolFees();

      expect(protocolFees).toEqual({
        deposit: 1000000000000000000n,
        withdraw: 2000000000000000000n,
        spend: 500000000000000000n,
      });
    });
  });

  describe("getDepositFeesData", () => {
    it("should return deposit fees data for sponsored method", async () => {
      const decimals = 18;
      const result = await fees.getDepositFeesData(decimals);

      expect(result).toMatchObject({
        depositFee: 1000000000000000000n,
        paymasterAddress: "0xPaymaster",
        coveredGas: 100000n,
        fee: 0n,
        roundedFee: "1",
      });
    });

    it("should return deposit fees data for non-sponsored method", async () => {
      // Mock Tes to return non-sponsored method
      vi.mocked(mockTesService.quote).mockResolvedValueOnce({
        gasPrice: 20000000000n,
        paymasterAddress: "0xPaymaster",
        sponsoredVaultMethods: ["withdraw"], // deposit not sponsored
      });

      const decimals = 18;
      const result = await fees.getDepositFeesData(decimals);

      expect(result).toMatchObject({
        depositFee: 1000000000000000000n,
        paymasterAddress: "0xPaymaster",
        roundedFee: expect.any(String),
      });
      expect(result.fee).toBeGreaterThan(0n);
      expect(result.coveredGas).toBeGreaterThan(0n);
    });
  });

  describe("getWithdrawFeesData", () => {
    it("should return withdraw fees data for sponsored method", async () => {
      const decimals = 18;
      const withdrawingItemsAmount = 3;
      const result = await fees.getWithdrawFeesData(
        decimals,
        withdrawingItemsAmount,
      );

      expect(result).toMatchObject({
        withdrawFee: 2000000000000000000n,
        paymasterAddress: "0xPaymaster",
        coveredGas: 180000n, // 150000 + 3 * 10000
        fee: 0n,
        roundedFee: "2",
      });
    });

    it("should return withdraw fees data for non-sponsored method", async () => {
      // Mock Tes to return non-sponsored method
      vi.mocked(mockTesService.quote).mockResolvedValueOnce({
        gasPrice: 20000000000n,
        paymasterAddress: "0xPaymaster",
        sponsoredVaultMethods: ["deposit"], // withdraw not sponsored
      });

      const decimals = 18;
      const withdrawingItemsAmount = 2;
      const result = await fees.getWithdrawFeesData(
        decimals,
        withdrawingItemsAmount,
      );

      expect(result).toMatchObject({
        withdrawFee: 2000000000000000000n,
        paymasterAddress: "0xPaymaster",
        roundedFee: expect.any(String),
      });
      expect(result.fee).toBeGreaterThan(0n);
      expect(result.coveredGas).toBeGreaterThan(0n);
    });

    it("should calculate different gas limits based on withdrawing items amount", async () => {
      const decimals = 18;

      const result1 = await fees.getWithdrawFeesData(decimals, 1);
      const result2 = await fees.getWithdrawFeesData(decimals, 5);

      expect(result1.coveredGas).toBe(160000n); // 150000 + 1 * 10000
      expect(result2.coveredGas).toBe(200000n); // 150000 + 5 * 10000
    });
  });

  describe("getSpendFeesData", () => {
    it("should return spend fees data for sponsored method", async () => {
      // Mock Tes to include spend in sponsored methods
      vi.mocked(mockTesService.quote).mockResolvedValueOnce({
        gasPrice: 20000000000n,
        paymasterAddress: "0xPaymaster",
        sponsoredVaultMethods: ["deposit", "withdraw", "spend"],
      });

      const decimals = 18;
      const result = await fees.getSpendFeesData(decimals);

      expect(result).toMatchObject({
        spendFee: 500000000000000000n,
        paymasterAddress: "0xPaymaster",
        coveredGas: 200000n,
        fee: 0n,
        roundedFee: "0.5",
      });
    });

    it("should return spend fees data for non-sponsored method", async () => {
      const decimals = 18;
      const result = await fees.getSpendFeesData(decimals);

      expect(result).toMatchObject({
        spendFee: 500000000000000000n,
        paymasterAddress: "0xPaymaster",
        roundedFee: expect.any(String),
      });
      expect(result.fee).toBeGreaterThan(0n);
      expect(result.coveredGas).toBeGreaterThan(0n);
    });
  });

  describe("getBaseFeesData (private method tested through public methods)", () => {
    it("should handle different decimals correctly", async () => {
      const result6 = await fees.getDepositFeesData(6);
      const result18 = await fees.getDepositFeesData(18);

      expect(result6.roundedFee).toBeDefined();
      expect(result18.roundedFee).toBeDefined();
      // The rounded fee should be formatted according to the decimals
      expect(typeof result6.roundedFee).toBe("string");
      expect(typeof result18.roundedFee).toBe("string");
    });

    it("should handle zero gas price", async () => {
      vi.mocked(mockTesService.quote).mockResolvedValueOnce({
        gasPrice: 0n,
        paymasterAddress: "0xPaymaster",
        sponsoredVaultMethods: [],
      });

      const decimals = 18;

      // Zero gas price should cause a division by zero error
      await expect(fees.getDepositFeesData(decimals)).rejects.toThrow();
    });

    it("should handle high gas price", async () => {
      vi.mocked(mockTesService.quote).mockResolvedValueOnce({
        gasPrice: 1000000000000n, // 1000 gwei
        paymasterAddress: "0xPaymaster",
        sponsoredVaultMethods: [],
      });

      const decimals = 18;
      const result = await fees.getDepositFeesData(decimals);

      expect(result.fee).toBeGreaterThan(0n);
      expect(result.coveredGas).toBeGreaterThan(0n);
    });
  });

  describe("error handling", () => {
    it("should handle Tes service quote failure", async () => {
      vi.mocked(mockTesService.quote).mockRejectedValueOnce(
        new Error("Tes service error"),
      );

      const decimals = 18;

      await expect(fees.getDepositFeesData(decimals)).rejects.toThrow(
        "Tes service error",
      );
    });
  });
});
