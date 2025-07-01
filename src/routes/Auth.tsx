import { MainBanner } from "@components/MainBanner";
import { RegisterForm } from "@src/components/RegisterForm";

export default function Auth() {
  return (
    <div className="dark:text-white flex flex-col h-dvh justify-center overflow-hidden">
      <MainBanner />
      <RegisterForm />
    </div>
  );
}
