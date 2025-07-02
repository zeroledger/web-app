import { buildPoseidon } from "circomlibjs";

const poseidon_ = buildPoseidon();

export async function computePoseidon({
  amount,
  entropy,
}: {
  amount: bigint;
  entropy: bigint;
}): Promise<bigint> {
  const poseidon = await poseidon_;
  return BigInt(poseidon.F.toString(poseidon([amount, entropy])));
}
