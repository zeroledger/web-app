import {
  type Hex,
  isAddress,
  getAddress,
  slice,
  hexToBigInt,
  parseUnits,
  formatUnits,
} from "viem";

export const formatValue = (
  value?: string,
  isLoading?: boolean,
  isError?: boolean,
) => {
  if (isError) {
    return "error";
  }
  if (isLoading) {
    return "loading..";
  }
  return value as string;
};

export const shortString = (str?: string) =>
  `${str?.substring(0, 6)}...${str?.substring(str?.length - 4)}`;

export const logStringify = (value: unknown) =>
  JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? `${v.toString()}n` : v),
    2,
  );

export const format = <T>(data: T): T => {
  if (typeof data !== "object" && typeof data !== "string") {
    return data as T;
  }
  if (typeof data === "string") {
    return (isAddress(data) ? getAddress(data) : data) as T;
  }
  if (Array.isArray(data)) {
    return data.map(format) as T;
  }
  return Object.entries(data as object).reduce(
    (acc, [key, value]) => {
      acc[isAddress(key) ? getAddress(key) : key] = format(value);
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as Record<string, any>,
  ) as T;
};

export const delay = <T>(ms: number, value?: T) =>
  new Promise((res) => {
    setTimeout(() => {
      res(value);
    }, ms);
  });

export type NormalizedSignature = { r: Hex; s: Hex; v: number };

export const toSignature = (serializedSignature: Hex): NormalizedSignature => ({
  r: slice(serializedSignature, 0, 32),
  s: slice(serializedSignature, 32, 64),
  v: parseInt(slice(serializedSignature, 64, 65)),
});

export const toViemSignature = (serializedSignature: Hex) => {
  const [r, s, v] = [
    slice(serializedSignature, 0, 32),
    slice(serializedSignature, 32, 64),
    slice(serializedSignature, 64, 65),
  ];
  return { r, s, v: hexToBigInt(v), yParity: undefined };
};

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  let currentIndex = result.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [result[currentIndex], result[randomIndex]] = [
      result[randomIndex],
      result[currentIndex],
    ];
  }
  return result;
}

export const semiStringToUint8Array = (data: string) =>
  new Uint8Array(data.split(",").map(Number));

export const getMaxFormattedValue = (
  value: string,
  decimals: number,
  privateBalance: bigint,
) => {
  // If the value is empty or just a dot, return it as-is
  if (value === "" || value === ".") {
    return value;
  }

  // Handle partial decimal numbers
  let normalizedValue = value;
  if (value.endsWith(".")) {
    normalizedValue = value + "0";
  }

  try {
    const rawValue = parseUnits(normalizedValue, decimals);
    const amount =
      rawValue > privateBalance
        ? formatUnits(privateBalance, decimals)
        : formatUnits(rawValue, decimals);
    return amount;
  } catch {
    // If parsing fails, return the original value
    return value;
  }
};

export const formatBalance = (value: bigint, decimals: number): string => {
  const formatted = formatUnits(value, decimals);

  // Split by decimal point
  const parts = formatted.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1] || "";

  // If there's a decimal part, limit to 2 digits
  if (decimalPart.length > 0) {
    return `${integerPart}.${decimalPart.slice(0, 2)}`;
  }

  // If no decimal part, just return the integer part
  return integerPart;
};

/**
 * Rounds a token amount up to the nearest cent (2 decimals).
 *
 * @param amount - token amount as bigint (smallest units)
 * @param decimals - token decimals (e.g., 18 for ETH, 6 for USDC)
 * @returns string value rounded up to cents
 */
export function roundToCents(amount: bigint, decimals: number): string {
  // Convert bigint to decimal string
  const human = parseFloat(formatUnits(amount, decimals));

  // Multiply by 100 (cents), ceil, then divide back
  const rounded = Math.ceil(human * 100) / 100;

  // Return as string with 2 decimal places
  return rounded.toFixed(2);
}

export function createRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_ ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
