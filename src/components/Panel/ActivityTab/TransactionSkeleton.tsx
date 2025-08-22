export default function TransactionSkeleton() {
  return (
    <li className="bg-white/5 rounded-lg p-4 text-white shadow animate-pulse">
      <div className="h-6 w-1/3 bg-white/20 rounded mb-3" />
      <div className="h-9 w-2/3 bg-white/10 rounded mb-3" />
      <div className="h-6 w-1/2 bg-white/10 rounded mb-3" />
      <div className="h-6 w-1/2 bg-white/10 rounded" />
    </li>
  );
}
