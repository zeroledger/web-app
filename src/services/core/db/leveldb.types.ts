import { BatchOperation, BrowserLevel } from "browser-level";

export type Batch = BatchOperation<
  BrowserLevel<string, string>,
  string,
  string
>[];
