import type { DataSource } from "@src/services/core/db/leveldb.source";

export const createMockDataSource = (): DataSource => {
  const store = new Map<string, string>();
  const batch = async (
    operations: Array<{ type: "put" | "del"; key: string; value?: string }>,
  ) => {
    for (const op of operations) {
      if (op.type === "put" && op.value) {
        store.set(op.key, op.value);
      } else if (op.type === "del") {
        store.delete(op.key);
      }
    }
  };
  return {
    getEntityLevel: () => ({
      get: async (key: string) => store.get(key),
      getMany: async (keys: string[]) =>
        keys.map((k) => store.get(k) ?? null).filter(Boolean),
      put: async (key: string, value: string) => {
        store.set(key, value);
      },
      del: async (key: string) => {
        store.delete(key);
      },
      batch,
      values: () => ({
        all: async () => Array.from(store.values()),
      }),
      clear: async () => {
        store.clear();
      },
    }),
    db: { batch },
  } as unknown as DataSource;
};
