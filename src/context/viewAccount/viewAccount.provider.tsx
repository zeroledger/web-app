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
    let resetProbablyNeeded = true;
    if (viewAccount.hasEncryptedViewAccount()) {
      await viewAccount
        .unlockViewAccount()
        .then(() => {
          setAuthorized(true);
          resetProbablyNeeded = false;
        })
        .catch();
    } else {
      setAuthorized(false);
      viewAccount.prepareViewAccount();
    }
    return resetProbablyNeeded;
  }, []);

  const resetViewAccount = useCallback(() => {
    setViewAccount(undefined);
    setAuthorized(false);
    setPassword(undefined);
  }, []);

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

/**
 * new wallet.address or chain
 * 1. close existing evm client, ledger
 * 2. create new evm client
 * 3. open new evm client
 * 4. new view account
 * 5. if unlock => new ledger & sync
 * 6. else => reset password & authorization and go to login
 */

/**
 * login => enter password
 * if no evm client => create & open
 * new view account & unlock or prepare
 * reset ledger and init new one
 */

/**
 * new chain (unsupported)
 * show modal to switch chain
 */

/**
 * resetting = finishing all async actions, so we need to have a global registry for it
 */
