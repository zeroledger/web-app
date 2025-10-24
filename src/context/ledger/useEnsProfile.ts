import { Address } from "viem";
import { normalize } from "viem/ens";
import { ens } from "@src/services/Ens";
import { useState, useEffect } from "react";

const fetchEnsProfile = async (
  address: Address,
): Promise<{
  name?: string;
  avatar?: string;
}> => {
  const ensName = await ens.client.getEnsName({
    address,
  });
  if (!ensName) return {};
  const ensAvatar = await ens.client.getEnsAvatar({
    name: normalize(ensName),
  });
  if (!ensAvatar) {
    return { name: ensName };
  }
  return { name: ensName, avatar: ensAvatar };
};

export const useEnsProfile = (address: Address | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [data, setData] = useState<{
    name?: string;
    avatar?: string;
  }>({});

  useEffect(() => {
    if (!address) return;
    setIsLoading(true);
    fetchEnsProfile(address)
      .then(setData)
      .catch((e) => {
        console.error(e);
        setData({});
        setError(e);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [address]);

  return { data, isLoading, error };
};
