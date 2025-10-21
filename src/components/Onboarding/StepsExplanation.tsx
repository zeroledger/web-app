const steps = [
  "Connect or Sign In",
  "Set Account Password",
  "Generate & Authorize View Keys",
];

export default function StepsExplanation() {
  return (
    <div className="w-full max-w-xs mx-auto my-3">
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <p className="text-base text-white/60 mb-3 text-center">
          Getting Started
        </p>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-white/80"
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {index + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
