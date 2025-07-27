import { ViewAccountService } from "@src/services/viewAccount.service";
import { createContext } from "react";

export const ViewAccountContext = createContext<{
  viewAccount?: ViewAccountService;
  setPassword: (password: string) => void;
  authorized: boolean;
  authorize: () => Promise<void>;
  isLoading: boolean;
}>({
  viewAccount: undefined,
  setPassword: () => {},
  authorized: false,
  authorize: async () => {},
  isLoading: false,
});
