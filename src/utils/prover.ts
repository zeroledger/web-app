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
  private cache: Map<CircuitType, Promise<[Uint8Array, Uint8Array]>> =
    new Map();

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

  /**
   * Preloads all circuit dependencies for better performance
   * This should be called when user enters wallet pages
   */
  preloadVitalCircuits(): void {
    const circuitTypes: CircuitType[] = [
      "deposit",
      "spend32",
      "spend22",
      "spend23",
      "spend21",
      "spend31",
      "spend12",
      "spend13",
    ];

    circuitTypes.forEach((circuitType) => {
      if (this.cache.has(circuitType)) {
        return;
      }
      this.cache.set(circuitType, this.provedDeps(circuitType));
    });
  }

  private provedDeps(
    circuitType: CircuitType,
  ): Promise<[Uint8Array, Uint8Array]> {
    // Check cache first
    const cached = this.cache.get(circuitType);
    if (cached) {
      return cached;
    }

    // Load and cache if not found
    let wasm: Promise<Uint8Array>;
    let zkey: Promise<Uint8Array>;

    switch (circuitType) {
      case "deposit":
        wasm = this.urlBuffLoader(depositWasmUrl);
        zkey = this.urlBuffLoader(depositWasmZkey);
        break;
      case "spend11":
        wasm = this.urlBuffLoader(spend11WasmUrl);
        zkey = this.urlBuffLoader(spend11Zkey);
        break;
      case "spend12":
        wasm = this.urlBuffLoader(spend12WasmUrl);
        zkey = this.urlBuffLoader(spend12Zkey);
        break;
      case "spend13":
        wasm = this.urlBuffLoader(spend13WasmUrl);
        zkey = this.urlBuffLoader(spend13Zkey);
        break;
      case "spend21":
        wasm = this.urlBuffLoader(spend21WasmUrl);
        zkey = this.urlBuffLoader(spend21Zkey);
        break;
      case "spend22":
        wasm = this.urlBuffLoader(spend22WasmUrl);
        zkey = this.urlBuffLoader(spend22Zkey);
        break;
      case "spend23":
        wasm = this.urlBuffLoader(spend23WasmUrl);
        zkey = this.urlBuffLoader(spend23Zkey);
        break;
      case "spend31":
        wasm = this.urlBuffLoader(spend31WasmUrl);
        zkey = this.urlBuffLoader(spend31Zkey);
        break;
      case "spend32":
        wasm = this.urlBuffLoader(spend32WasmUrl);
        zkey = this.urlBuffLoader(spend32Zkey);
        break;
      case "spend161":
        wasm = this.urlBuffLoader(spend161WasmUrl);
        zkey = this.urlBuffLoader(spend161Zkey);
        break;
      default:
        throw new Error(`Invalid circuitType ${circuitType}`);
    }

    // Cache the loaded dependencies
    this.cache.set(circuitType, Promise.all([wasm, zkey]));
    return this.cache.get(circuitType)!;
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
