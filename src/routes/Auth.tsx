import { lazy } from "react";

const RegisterForm = lazy(() =>
  import("@src/components/RegisterForm").then((module) => ({
    default: module.RegisterForm,
  })),
);

const MainBanner = lazy(() =>
  import("@src/components/MainBanner").then((module) => ({
    default: module.MainBanner,
  })),
);

export default function Auth() {
  return (
    <div className="dark:text-white flex flex-col h-dvh justify-center overflow-hidden">
      <MainBanner />
      <RegisterForm />
    </div>
  );
}
