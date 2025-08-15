import { toast } from "react-toastify";
import {
  catchService,
  CatchServiceEvents,
} from "@src/services/core/catch.service";
import { useEffect } from "react";

const errorNotificationListener = (message: string) =>
  toast.error(message, {
    theme: "dark",
  });

const warnNotificationListener = (message: string) =>
  toast.warn(message, {
    theme: "dark",
  });

export default function useNotification() {
  useEffect(() => {
    catchService.on(CatchServiceEvents.ERROR, errorNotificationListener);
    catchService.on(CatchServiceEvents.WARN, warnNotificationListener);

    return () => {
      catchService.off(CatchServiceEvents.ERROR, errorNotificationListener);
      catchService.off(CatchServiceEvents.WARN, warnNotificationListener);
    };
  });
}
