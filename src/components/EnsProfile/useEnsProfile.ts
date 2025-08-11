import useSWR from "swr";
import { Address } from "viem";
import { normalize } from "viem/ens";
import { ensClient } from "./ensClient";

export const useEnsProfile = (address: Address) => {
  const fetchEnsProfile = async (): Promise<{
    name?: string;
    avatar?: string;
  }> => {
    const ensName = await ensClient.getEnsName({
      address,
      strict: true,
    });
    if (!ensName) return {};
    const ensAvatar = await ensClient.getEnsAvatar({
      name: normalize(ensName),
    });
    if (!ensAvatar) {
      return { name: ensName };
    }
    return { name: ensName, avatar: ensAvatar };
  };

  return useSWR(address, fetchEnsProfile, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });
};
