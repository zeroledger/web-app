import {
  type CircuitSignals,
  type PlonkProof,
  type PublicSignals,
} from "snarkjs";

import depositWasmUrl from "@src/assets/deposit/deposit.wasm?url";
import depositWasmZkey from "@src/assets/deposit/deposit.zkey?url";
import spend11WasmUrl from "@src/assets/spend_11/spend_11.wasm?url";
import spend11Zkey from "@src/assets/spend_11/spend_11.zkey?url";
import spend12WasmUrl from "@src/assets/spend_12/spend_12.wasm?url";
import spend12Zkey from "@src/assets/spend_12/spend_12.zkey?url";
import spend13WasmUrl from "@src/assets/spend_13/spend_13.wasm?url";
import spend13Zkey from "@src/assets/spend_13/spend_13.zkey?url";
import spend21WasmUrl from "@src/assets/spend_21/spend_21.wasm?url";
import spend21Zkey from "@src/assets/spend_21/spend_21.zkey?url";
import spend22WasmUrl from "@src/assets/spend_22/spend_22.wasm?url";
import spend22Zkey from "@src/assets/spend_22/spend_22.zkey?url";
import spend23WasmUrl from "@src/assets/spend_23/spend_23.wasm?url";
import spend23Zkey from "@src/assets/spend_23/spend_23.zkey?url";
import spend31WasmUrl from "@src/assets/spend_31/spend_31.wasm?url";
import spend31Zkey from "@src/assets/spend_31/spend_31.zkey?url";
import spend32WasmUrl from "@src/assets/spend_32/spend_32.wasm?url";
import spend32Zkey from "@src/assets/spend_32/spend_32.zkey?url";
import spend161WasmUrl from "@src/assets/spend_161/spend_161.wasm?url";
import spend161Zkey from "@src/assets/spend_161/spend_161.zkey?url";

const toBytesBuff = (buff: ArrayBuffer) => new Uint8Array(buff);

export type Proof = [
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
];

export type CircuitType =
  | "deposit"
  | "spend11"
  | "spend12"
  | "spend13"
  | "spend21"
  | "spend22"
  | "spend23"
  | "spend31"
  | "spend32"
  | "spend161";

const snarkjs = import("snarkjs");

class Prover {
  constructor() {
    this.provedDeps = this.provedDeps.bind(this);
  }

  private urlBuffLoader(url: string) {
    return fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${url} download failed`);
        return res.arrayBuffer();
      })
      .then(toBytesBuff);
  }

  private provedDeps(circuitType: CircuitType) {
    switch (circuitType) {
      case "deposit":
        return [
          this.urlBuffLoader(depositWasmUrl),
          this.urlBuffLoader(depositWasmZkey),
        ];
      case "spend11":
        return [
          this.urlBuffLoader(spend11WasmUrl),
          this.urlBuffLoader(spend11Zkey),
        ];
      case "spend12":
        return [
          this.urlBuffLoader(spend12WasmUrl),
          this.urlBuffLoader(spend12Zkey),
        ];
      case "spend13":
        return [
          this.urlBuffLoader(spend13WasmUrl),
          this.urlBuffLoader(spend13Zkey),
        ];
      case "spend21":
        return [
          this.urlBuffLoader(spend21WasmUrl),
          this.urlBuffLoader(spend21Zkey),
        ];
      case "spend22":
        return [
          this.urlBuffLoader(spend22WasmUrl),
          this.urlBuffLoader(spend22Zkey),
        ];
      case "spend23":
        return [
          this.urlBuffLoader(spend23WasmUrl),
          this.urlBuffLoader(spend23Zkey),
        ];
      case "spend31":
        return [
          this.urlBuffLoader(spend31WasmUrl),
          this.urlBuffLoader(spend31Zkey),
        ];
      case "spend32":
        return [
          this.urlBuffLoader(spend32WasmUrl),
          this.urlBuffLoader(spend32Zkey),
        ];
      case "spend161":
        return [
          this.urlBuffLoader(spend161WasmUrl),
          this.urlBuffLoader(spend161Zkey),
        ];
      default:
        throw new Error(`Invalid circuitType ${circuitType}`);
    }
  }

  async runPlonkProof(circuitType: CircuitType, inputs: CircuitSignals) {
    // 1. Fetch the WASM witness calculator
    const [wasmBuff, zkeyBuff] = await this.provedDeps(circuitType);
    const { plonk } = await snarkjs;

    // 3. Compute proof + public signals in one call
    //    fullProve = calc witness → generate proof
    const { proof, publicSignals } = await plonk.fullProve(
      inputs,
      await wasmBuff,
      await zkeyBuff,
    );

    return { proof, publicSignals };
  }

  async exportSolidityCallData(
    proof: PlonkProof,
    publicSignals: PublicSignals,
  ) {
    const { plonk } = await snarkjs;

    // Get calldata for Solidity verifier
    const calldata = await plonk.exportSolidityCallData(proof, publicSignals);
    // calldata is a string like: '[proofArray][pubSignalsArray]'
    const match = calldata.match(/\[(.*?)\]\[(.*?)\]/);
    if (!match) throw new Error("Invalid calldata format");
    const proofArr = match[1]
      .split(",")
      .map((val: string) => BigInt(val.trim().replace(/"/g, "")));
    const pubSignalsArr: string[] = match[2]
      .split(",")
      .map((val: string) => val.trim().replace(/"/g, ""));
    return {
      calldata_proof: proofArr as Proof,
      calldata_pubSignals: pubSignalsArr,
    };
  }
}

export const prover = new Prover();

export function getCircuitType(
  inputCount: number,
  outputCount: number,
): CircuitType {
  if (inputCount === 1 && outputCount === 1) return "spend11";
  if (inputCount === 1 && outputCount === 2) return "spend12";
  if (inputCount === 1 && outputCount === 3) return "spend13";
  if (inputCount === 2 && outputCount === 1) return "spend21";
  if (inputCount === 2 && outputCount === 2) return "spend22";
  if (inputCount === 2 && outputCount === 3) return "spend23";
  if (inputCount === 3 && outputCount === 1) return "spend31";
  if (inputCount === 3 && outputCount === 2) return "spend32";
  if (inputCount === 16 && outputCount === 1) return "spend161";

  throw new Error(
    `Unsupported circuit type: ${inputCount} inputs, ${outputCount} outputs`,
  );
}
