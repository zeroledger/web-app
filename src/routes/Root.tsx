import Onboarding from "@src/components/Onboarding/Onboarding";
import PageContainer from "@src/components/PageContainer";

const urgentMessage = import.meta.env.VITE_URGENT_MESSAGE;

export default function Root() {
  return (
    <PageContainer>
      {urgentMessage && (
        <div className="text-white text-center bg-amber-500 p-4 mb-10">
          {urgentMessage}
        </div>
      )}
      <Onboarding />
    </PageContainer>
  );
}
