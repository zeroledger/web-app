import {
  createContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  createWalletClient,
  http,
  type PrivateKeyAccount,
  type Hex,
  publicActions,
  type Address,
  fallback,
  webSocket,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Chain, optimismSepolia } from "viem/chains";
import { decryptData, encryptData } from "@src/utils/crypt";
import { OnesHash, RPC, WS_RPC, pollingInterval } from "@src/common.constants";
import { APP_PREFIX_KEY } from "@src/common.constants";
import { SocketRpcClient } from "viem/utils";
import { CustomClient } from "@src/common.types";
import { DataSource } from "@src/services/db/leveldb.service";

type EncryptedAccountsStore = Record<
  string,
  {
    authTag: string;
    ciphertext: string;
    iv: string;
    salt: string;
  }
>;

const semiStringToUint8Array = (data: string) =>
  new Uint8Array(data.split(",").map(Number));

const defaultTransport = http();
const defaultAccount = privateKeyToAccount(OnesHash);
const defaultClient = createWalletClient({
  account: defaultAccount,
  chain: optimismSepolia,
  transport: defaultTransport,
}).extend(publicActions) as CustomClient;

const voidFn = () => {};

const PKS_STORE_KEY = `${APP_PREFIX_KEY}.encodedPKs`;

const getEncryptedDataJson = () => localStorage.getItem(PKS_STORE_KEY);

const getAccounts = () => Object.keys(JSON.parse(getEncryptedDataJson() ?? ""));

const defaultContext = {
  signUp: voidFn as unknown as (
    password: string,
    privateKey: Hex,
    chain?: Chain,
  ) => Promise<void>,
  client: defaultClient,
  login: voidFn as unknown as (
    password: string,
    chain?: Chain,
  ) => Promise<void>,
  onlyLogin: false,
  loggedIn: false,
  getAccounts,
  pk: "0x0" as Hex,
  prune: voidFn as unknown as () => Promise<void>,
};

const ClientContext = createContext(defaultContext);

const ClientProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const [passInMemory, setPassword] = useState<string>("");
  const [client, setClient] = useState<CustomClient>(defaultClient);
  const [pk, setPk] = useState<Hex>("0x0");

  const loggedIn = client.account.address !== defaultClient.account.address;

  const configure = useCallback(
    (account: PrivateKeyAccount, chain: Chain) => {
      const client = createWalletClient({
        account,
        chain,
        transport: fallback([
          webSocket(WS_RPC[chain.id]),
          http(RPC[chain.id]),
          http(),
        ]),
        pollingInterval: pollingInterval[chain.id],
      }).extend(publicActions);
      setClient(client);
    },
    [setClient],
  );

  const login = useCallback(
    async (password: string, chain: Chain = optimismSepolia) => {
      const encryptedDataJson = getEncryptedDataJson();
      if (!encryptedDataJson) {
        return;
      }
      const encryptedData = Object.values(
        JSON.parse(encryptedDataJson) as EncryptedAccountsStore,
      )[0];
      const encodedPrivateKey = {
        authTag: semiStringToUint8Array(encryptedData.authTag),
        ciphertext: semiStringToUint8Array(encryptedData.ciphertext),
        iv: semiStringToUint8Array(encryptedData.iv),
        salt: semiStringToUint8Array(encryptedData.salt),
      };

      const pk = (await decryptData(encodedPrivateKey, password)) as Hex;
      setPk(pk);
      const account = privateKeyToAccount(pk);
      setPassword(password);
      configure(account, chain);
    },
    [configure, setPassword, setPk],
  );

  const signUp = useCallback(
    async (
      password: string,
      privateKey: Hex,
      chain: Chain = optimismSepolia,
    ) => {
      setPk(privateKey);
      const account = privateKeyToAccount(privateKey);
      configure(account, chain);
      setPassword(password);
      const encryption = await encryptData(privateKey, password);

      const encryptedDataJson = JSON.stringify({
        [account.address]: {
          authTag: encryption.authTag.toString(),
          ciphertext: encryption.ciphertext.toString(),
          iv: encryption.iv.toString(),
          salt: encryption.salt.toString(),
        },
      });
      localStorage.setItem(PKS_STORE_KEY, encryptedDataJson);
    },
    [configure],
  );

  const changeAccount = useCallback(
    async (changedAccount: Address, chain: Chain = optimismSepolia) => {
      const encryptedDataJson = getEncryptedDataJson();
      if (!encryptedDataJson) {
        return;
      }
      const accountsStore: EncryptedAccountsStore =
        JSON.parse(encryptedDataJson);
      const { authTag, ciphertext, iv, salt } = accountsStore[changedAccount];

      const encodedPrivateKey = {
        authTag: semiStringToUint8Array(authTag),
        ciphertext: semiStringToUint8Array(ciphertext),
        iv: semiStringToUint8Array(iv),
        salt: semiStringToUint8Array(salt),
      };

      const pk = (await decryptData(encodedPrivateKey, passInMemory)) as Hex;
      setPk(pk);
      const account = privateKeyToAccount(pk);

      configure(account, chain);
    },
    [configure, passInMemory, setPk],
  );

  const prune = useCallback(async () => {
    // Clear localStorage
    localStorage.removeItem(PKS_STORE_KEY);

    // Clear LevelDB
    const dataSource = new DataSource();
    await dataSource.clear();

    // Reset client state
    setClient(defaultClient);
    setPk("0x0");
    setPassword("");
  }, []);

  const value = useMemo(
    () => ({
      signUp,
      client,
      login,
      onlyLogin: !!getEncryptedDataJson(),
      loggedIn,
      changeAccount,
      getAccounts,
      pk,
      prune,
    }),
    [client, loggedIn, login, signUp, changeAccount, pk, prune],
  );

  useEffect(() => {
    return () => {
      for (let i = 0; i < client.transport?.transports?.length; i++) {
        const { value } = client.transport.transports[i];
        if (value.getRpcClient) {
          value
            .getRpcClient()
            .then((rpc: SocketRpcClient<WebSocket>) => rpc.close());
        }
      }
    };
  }, [client]);

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
};

export { ClientContext, ClientProvider };
