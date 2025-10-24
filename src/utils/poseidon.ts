export async function computePoseidon({
  amount,
  entropy,
}: {
  amount: bigint;
  entropy: bigint;
}): Promise<bigint> {
  const { poseidon2 } = await import("poseidon-lite");
  return poseidon2([amount, entropy]);
}
