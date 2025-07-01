import { toast } from "react-toastify";
import { catchService } from "@src/services/catch/catch.service";
import { useEffect } from "react";

const errorNotificationListener = (message: string) =>
  toast.error(message, {
    theme: "dark",
  });

export default function useNotification() {
  useEffect(() => {
    catchService.on("errorNotification", errorNotificationListener);

    return () => {
      catchService.off("errorNotification", errorNotificationListener);
    };
  });
}
