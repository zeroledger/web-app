import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay = ({
  value,
  size = 192,
  className = "",
}: QRCodeDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current || !value) return;

      try {
        setIsLoading(true);
        setError(null);

        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000", // Black QR code
            light: "#00000000", // Transparent background
          },
          errorCorrectionLevel: "M",
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to generate QR code:", err);
        setError("Failed to generate QR code");
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [value, size]);

  if (error) {
    return (
      <div
        className={`w-48 h-48 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="text-red-400 text-sm mb-2">Error</div>
          <div className="text-gray-500 text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className={`w-48 h-48 rounded-lg bg-white ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
      />
      {isLoading && (
        <div className="absolute inset-0 w-48 h-48 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">Generating QR Code</div>
            <div className="text-gray-500 text-xs">Please wait...</div>
          </div>
        </div>
      )}
      {/* Logo overlay in the center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-lg p-2 shadow-lg">
        <img
          src="/logo.png"
          alt="ZeroLedger Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Hide logo if it fails to load
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    </div>
  );
};
