import { type ViewAccountService } from "@src/services/viewAccount.service";
import { createContext } from "react";

export const ViewAccountContext = createContext<{
  setViewAccount: (viewAccount: ViewAccountService | undefined) => void;
  viewAccount?: ViewAccountService;
  password?: string;
  setPassword: (password: string) => void;
  authorized: boolean;
  authorize: (viewAccount: ViewAccountService) => Promise<void>;
  unlock: (viewAccount: ViewAccountService) => Promise<void>;
  resetViewAccount: (config: { resetPassword?: boolean }) => void;
}>({
  setViewAccount: () => {},
  viewAccount: undefined,
  password: undefined,
  setPassword: () => {},
  authorized: false,
  authorize: async () => {},
  unlock: async () => {},
  resetViewAccount: () => {},
});
