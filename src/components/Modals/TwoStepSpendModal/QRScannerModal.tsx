import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import { useQRScanner } from "./useQRScanner";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQRCodeDetected: (data: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onQRCodeDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isScanning, error, startScanning, stopScanning } = useQRScanner();

  useEffect(() => {
    if (isOpen && videoRef.current) {
      startScanning((data) => {
        onQRCodeDetected(data);
        onClose();
      }, videoRef.current);
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, startScanning, stopScanning, onQRCodeDetected, onClose]);

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 w-full h-dvh",
        "transition-all duration-500 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-900 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center">
        <div
          className={clsx(
            "flex flex-col w-full h-full px-6 md:w-[90%] md:max-w-2xl",
            "md:rounded-xl bg-gray-900",
            "overflow-hidden",
            "transition-all duration-500 ease-in-out",
            isOpen
              ? "translate-x-0 md:scale-100"
              : "translate-x-full md:translate-x-0 md:scale-95",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Scan QR Code</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Camera View */}
          <div className="flex-1 flex items-center justify-center p-4">
            {error ? (
              <div className="text-center">
                <div className="text-red-400 text-lg mb-2">Camera Error</div>
                <div className="text-gray-400 text-sm mb-4">{error}</div>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="relative w-full max-w-md aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover rounded-lg"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Visible canvas overlay for scanning area */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    background: "transparent",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "0.5rem",
                  }}
                />

                {/* Scanning overlay with better visual feedback */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner brackets with animation */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl-lg animate-pulse" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-tr-lg animate-pulse" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-green-400 rounded-bl-lg animate-pulse" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br-lg animate-pulse" />

                  {/* Scanning area highlight */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed border-white/50 rounded-lg" />

                  {/* Center scanning line with better animation */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent">
                    <div className="h-full w-1/3 bg-green-400 animate-pulse mx-auto shadow-lg shadow-green-400/50" />
                  </div>

                  {/* Corner dots for better targeting */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                  </div>
                </div>

                {/* Instructions with better styling */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-white text-sm font-medium">
                      {isScanning
                        ? "Position QR code within the frame"
                        : "Starting camera..."}
                    </div>
                    <div className="text-green-400 text-xs mt-1">
                      {isScanning
                        ? "Keep steady for best results"
                        : "Please wait..."}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-center text-gray-400 text-sm">
              {isScanning
                ? "Align QR code with the green frame for automatic scanning"
                : "Camera will start automatically when ready"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
