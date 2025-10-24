import { ToastContainer } from "react-toastify";
import useNotification from "./useNotification";

export default function Notification() {
  useNotification();
  return <ToastContainer />;
}
