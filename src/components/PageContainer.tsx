export default function PageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="text-white px-6 flex flex-col h-dvh justify-center items-center overflow-hidden">
      {children}
    </div>
  );
}
