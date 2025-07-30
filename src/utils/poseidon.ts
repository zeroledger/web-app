const dynamicLoadPoseidon = async () => {
  const { buildPoseidon } = await import("circomlibjs");
  return buildPoseidon();
};

const dynamicPoseidon = dynamicLoadPoseidon();

export async function computePoseidon({
  amount,
  entropy,
}: {
  amount: bigint;
  entropy: bigint;
}): Promise<bigint> {
  const poseidon = await dynamicPoseidon;
  return BigInt(poseidon.F.toString(poseidon([amount, entropy])));
}
