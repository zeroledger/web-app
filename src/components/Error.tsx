import { useRouteError } from "react-router-dom";

type BasicError = {
  statusText?: string;
  message?: string;
};

export default function Error() {
  const error = useRouteError() as BasicError;
  console.error(error);

  return (
    <div id="error-page" className="dark:text-white text-black h-dvh">
      <div className="mx-auto text-center flex flex-col justify-center h-full font-sans">
        <h1 className="text-2xl">Oops!</h1>
        <p className="text-xl my-2">Sorry, an unexpected error has occurred.</p>
        <p className="text-xl">{error.statusText || error.message}</p>
      </div>
    </div>
  );
}
