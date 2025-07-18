export type JsonValue =
  | string
  | number
  | boolean
  | null
  | Array<JsonValue>
  | { [x: string]: JsonValue };

export type JsonObj = { [x: string]: JsonValue };

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export type Keys<T> = keyof T;
