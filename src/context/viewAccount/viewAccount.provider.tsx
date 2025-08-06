import { ReactNode, useCallback, useMemo, useState } from "react";
import { ViewAccountContext } from "./viewAccount.context";
import { type ViewAccountService } from "@src/services/viewAccount.service";

export const ViewAccountProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [viewAccount, setViewAccount] = useState<
    ViewAccountService | undefined
  >(undefined);

  const [authorized, setAuthorized] = useState(false);

  const authorize = useCallback(async (viewAccount: ViewAccountService) => {
    if (viewAccount) {
      await viewAccount.authorize();
      setAuthorized(true);
    }
  }, []);

  const unlock = useCallback(async (viewAccount: ViewAccountService) => {
    if (viewAccount && viewAccount.hasEncryptedViewAccount()) {
      await viewAccount.unlockViewAccount();
      setAuthorized(true);
    }
    if (viewAccount) {
      viewAccount.prepareViewAccount();
    }
  }, []);

  const resetViewAccount = useCallback(
    ({ resetPassword }: { resetPassword?: boolean }) => {
      setViewAccount(undefined);
      setAuthorized(false);
      if (resetPassword) {
        setPassword(undefined);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      viewAccount,
      setViewAccount,
      password,
      setPassword,
      authorized,
      authorize,
      unlock,
      resetViewAccount,
    }),
    [
      viewAccount,
      setViewAccount,
      password,
      setPassword,
      authorized,
      authorize,
      unlock,
      resetViewAccount,
    ],
  );

  return (
    <ViewAccountContext.Provider value={value}>
      {children}
    </ViewAccountContext.Provider>
  );
};
