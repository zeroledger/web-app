export function ErrorMessage({
  message = "Something went wrong. Please try again.",
}: {
  message?: string;
}) {
  return (
    <div className="text-center">
      <p>{message}</p>
    </div>
  );
}
