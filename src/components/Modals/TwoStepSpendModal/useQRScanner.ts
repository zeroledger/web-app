import { useState, useCallback, useRef } from "react";
import jsQR from "jsqr";

export const useQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setError(null);

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }

    // Clear canvas
    if (canvasRef.current) {
      canvasRef.current = null;
    }
  }, []);

  const startScanning = useCallback(
    async (
      onQRCodeDetected: (data: string) => void,
      videoElement?: HTMLVideoElement,
    ) => {
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

        // Use provided video element or create one
        const video = videoElement || document.createElement("video");
        video.srcObject = stream;
        video.play();
        videoRef.current = video;

        // Create a canvas to capture frames
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvasRef.current = canvas;

        if (!context) {
          throw new Error("Canvas context not available");
        }

        // Set canvas size to match video
        const setupCanvas = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        };

        if (video.readyState >= video.HAVE_METADATA) {
          setupCanvas();
        } else {
          video.addEventListener("loadedmetadata", setupCanvas);
        }

        // Function to scan for QR codes
        const scanFrame = () => {
          if (!isScanning || !video || !context) {
            return;
          }

          if (video.readyState === video.HAVE_ENOUGH_DATA) {
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
              // QR code detected! Stop scanning and call callback
              onQRCodeDetected(code.data);
              stopScanning();
              return;
            }
          }

          if (isScanning) {
            animationFrameRef.current = requestAnimationFrame(scanFrame);
          }
        };

        // Start scanning
        animationFrameRef.current = requestAnimationFrame(scanFrame);

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
