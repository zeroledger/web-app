import { RouterProvider } from "react-router-dom";
import { LedgerProvider } from "@src/context/ledger.context";
import router from "./router";

function App() {
  return (
    <LedgerProvider>
      <RouterProvider router={router} />
    </LedgerProvider>
  );
}

export default App;
