import { useCallback, useState } from "react";

export const useViewAccountAuthorization = () => {
  const [password, setPassword] = useState<string | undefined>();

  const [authorized, setAuthorized] = useState(false);

  const resetViewAccountAuthorization = useCallback(() => {
    setAuthorized(false);
    setPassword(undefined);
  }, []);

  return {
    password,
    setPassword,
    authorized,
    setAuthorized,
    resetViewAccountAuthorization,
  };
};
