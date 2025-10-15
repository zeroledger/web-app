import {
  hashTypedData,
  HashTypedDataParameters,
  SignTypedDataParameters,
  TypedData,
} from "viem";
import { type CustomClient } from "@src/services/Clients";

export function signTypedData<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | "EIP712Domain",
>(client: CustomClient, obj: HashTypedDataParameters<typedData, primaryType>) {
  if (client.account.sign) {
    return client.account.sign({ hash: hashTypedData(obj) });
  } else {
    return client.signTypedData(
      obj as unknown as SignTypedDataParameters<
        typedData,
        string,
        CustomClient["account"]
      >,
    );
  }
}
