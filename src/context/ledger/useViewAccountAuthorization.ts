import { useCallback, useState } from "react";

export const useViewAccountAuthorization = () => {
  const [authorized, setAuthorized] = useState(false);

  const resetViewAccountAuthorization = useCallback(() => {
    setAuthorized(false);
  }, []);

  return {
    authorized,
    setAuthorized,
    resetViewAccountAuthorization,
  };
};
