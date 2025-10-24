interface IErrorWithMeta extends Error {
  status?: number;
  code?: string;
}

type UUID = ReturnType<Crypto["randomUUID"]>;

type Secret = `0x${string}`;

type BigIntString = string;
