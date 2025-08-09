export default function PageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark:text-white px-6 flex flex-col h-dvh justify-center overflow-hidden">
      {children}
    </div>
  );
}
