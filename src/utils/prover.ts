import { CircuitSignals, plonk, PlonkProof, PublicSignals } from "snarkjs";

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

type CircuitType =
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

class Prover {
  private depositWasm: Promise<Uint8Array<ArrayBuffer>>;
  private depositZkey: Promise<Uint8Array<ArrayBuffer>>;
  private spend11Wasm: Promise<Uint8Array<ArrayBuffer>>;
  private spend11Zkey: Promise<Uint8Array<ArrayBuffer>>;
  private spend12Wasm: Promise<Uint8Array<ArrayBuffer>>;
  private spend12Zkey: Promise<Uint8Array<ArrayBuffer>>;
  private spend13Wasm: Promise<Uint8Array<ArrayBuffer>>;
  private spend13Zkey: Promise<Uint8Array<ArrayBuffer>>;
  private spend21Wasm: Promise<Uint8Array<ArrayBuffer>>;
  private spend21Zkey: Promise<Uint8Array<ArrayBuffer>>;
  private spend22Wasm: Promise<Uint8Array<ArrayBuffer>>;
  private spend22Zkey: Promise<Uint8Array<ArrayBuffer>>;
  private spend23Wasm: Promise<Uint8Array<ArrayBuffer>>;
  private spend23Zkey: Promise<Uint8Array<ArrayBuffer>>;
  private spend31Wasm: Promise<Uint8Array<ArrayBuffer>>;
  private spend31Zkey: Promise<Uint8Array<ArrayBuffer>>;
  private spend32Wasm: Promise<Uint8Array<ArrayBuffer>>;
  private spend32Zkey: Promise<Uint8Array<ArrayBuffer>>;
  private spend161Wasm: Promise<Uint8Array<ArrayBuffer>>;
  private spend161Zkey: Promise<Uint8Array<ArrayBuffer>>;

  constructor() {
    this.depositZkey = this.urlBuffLoader(depositWasmZkey);
    this.depositWasm = this.urlBuffLoader(depositWasmUrl);
    this.spend11Zkey = this.urlBuffLoader(spend11Zkey);
    this.spend11Wasm = this.urlBuffLoader(spend11WasmUrl);
    this.spend12Zkey = this.urlBuffLoader(spend12Zkey);
    this.spend12Wasm = this.urlBuffLoader(spend12WasmUrl);
    this.spend13Zkey = this.urlBuffLoader(spend13Zkey);
    this.spend13Wasm = this.urlBuffLoader(spend13WasmUrl);
    this.spend21Zkey = this.urlBuffLoader(spend21Zkey);
    this.spend21Wasm = this.urlBuffLoader(spend21WasmUrl);
    this.spend22Zkey = this.urlBuffLoader(spend22Zkey);
    this.spend22Wasm = this.urlBuffLoader(spend22WasmUrl);
    this.spend23Zkey = this.urlBuffLoader(spend23Zkey);
    this.spend23Wasm = this.urlBuffLoader(spend23WasmUrl);
    this.spend31Zkey = this.urlBuffLoader(spend31Zkey);
    this.spend31Wasm = this.urlBuffLoader(spend31WasmUrl);
    this.spend32Zkey = this.urlBuffLoader(spend32Zkey);
    this.spend32Wasm = this.urlBuffLoader(spend32WasmUrl);
    this.spend161Zkey = this.urlBuffLoader(spend161Zkey);
    this.spend161Wasm = this.urlBuffLoader(spend161WasmUrl);
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
        return [this.depositWasm, this.depositZkey];
      case "spend11":
        return [this.spend11Wasm, this.spend11Zkey];
      case "spend12":
        return [this.spend12Wasm, this.spend12Zkey];
      case "spend13":
        return [this.spend13Wasm, this.spend13Zkey];
      case "spend21":
        return [this.spend21Wasm, this.spend21Zkey];
      case "spend22":
        return [this.spend22Wasm, this.spend22Zkey];
      case "spend23":
        return [this.spend23Wasm, this.spend23Zkey];
      case "spend31":
        return [this.spend31Wasm, this.spend31Zkey];
      case "spend32":
        return [this.spend32Wasm, this.spend32Zkey];
      case "spend161":
        return [this.spend161Wasm, this.spend161Zkey];
      default:
        throw new Error(`Invalid circuitType ${circuitType}`);
    }
  }

  async runPlonkProof(circuitType: CircuitType, inputs: CircuitSignals) {
    // 1. Fetch the WASM witness calculator
    const [wasmBuff, zkeyBuff] = await this.provedDeps(circuitType);

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
    // Get calldata for Solidity verifier
    const calldata = await plonk.exportSolidityCallData(proof, publicSignals);
    // calldata is a string like: '[proofArray][pubSignalsArray]'
    const match = calldata.match(/\[(.*?)\]\[(.*?)\]/);
    if (!match) throw new Error("Invalid calldata format");
    const proofArr: string[] = match[1]
      .split(",")
      .map((val: string) => val.trim().replace(/"/g, ""));
    const pubSignalsArr: string[] = match[2]
      .split(",")
      .map((val: string) => val.trim().replace(/"/g, ""));
    return { calldata_proof: proofArr, calldata_pubSignals: pubSignalsArr };
  }
}

export const prover = new Prover();
