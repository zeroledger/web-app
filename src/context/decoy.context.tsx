import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import axios from "axios";
import { ClientContext } from "@src/context/client.context";
import { type ClientController } from "@src/services/client/client.controller";
import { create } from "@src/services/init";

const DecoyContext = createContext<{
  clientController?: ClientController;
  balance: bigint;
  isConnecting: boolean;
  connected: boolean;
  error?: Error;
}>({
  isConnecting: false,
  connected: false,
  balance: 0n,
});
const axiosInstance = axios.create();

const DecoyProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const { client, pk } = useContext(ClientContext);

  const [clientController, setClientController] = useState<
    ClientController | undefined
  >({} as ClientController);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error>();
  const [balance, setBalance] = useState<bigint>(0n);
  useEffect(() => {
    const clientController = create(axiosInstance, client, pk);
    setClientController(clientController);
    setIsConnecting(true);
    clientController
      ?.start()
      .then((value) => {
        setBalance(value!);
        setConnected(true);
        setIsConnecting(false);
      })
      .catch((error) => {
        setError(error);
        setIsConnecting(false);
      });
  }, [client, pk]);

  return (
    <DecoyContext.Provider
      value={{
        clientController,
        isConnecting,
        connected,
        error,
        balance,
      }}
    >
      {children}
    </DecoyContext.Provider>
  );
};

export { DecoyContext, DecoyProvider };
