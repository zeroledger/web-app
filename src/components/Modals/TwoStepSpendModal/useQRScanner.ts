import { useState, useCallback, useRef } from "react";
import jsQR from "jsqr";

export const useQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startScanning = useCallback(
    async (onQRCodeDetected: (data: string) => void) => {
      try {
        setError(null);
        setIsScanning(true);

        // Check if the browser supports the MediaDevices API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera access not supported in this browser");
        }

        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Use back camera if available
        });

        streamRef.current = stream;

        // Create a video element to display the camera feed
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        // Create a canvas to capture frames
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas context not available");
        }

        // Set canvas size to match video
        video.addEventListener("loadedmetadata", () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        });

        // Function to scan for QR codes
        const scanFrame = () => {
          if (video.readyState === video.HAVE_ENOUGH_DATA && isScanning) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );

            // Use jsQR to detect QR codes
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
            );

            if (code) {
              // QR code detected!
              onQRCodeDetected(code.data);
              stopScanning();
              return;
            }
          }

          if (isScanning) {
            requestAnimationFrame(scanFrame);
          }
        };

        // Start scanning
        requestAnimationFrame(scanFrame);

        return {
          video,
          canvas,
          stream,
        };
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to access camera",
        );
        setIsScanning(false);
        return null;
      }
    },
    [isScanning, stopScanning],
  );

  return {
    isScanning,
    error,
    startScanning,
    stopScanning,
  };
};
