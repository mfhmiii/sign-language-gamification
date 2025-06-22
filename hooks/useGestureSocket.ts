import { useEffect, useRef } from "react";
import io from "socket.io-client";

export const useGestureSocket = (
  isCameraOpen: boolean,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onPrediction: (sentence: string) => void
): { stopCamera: () => void } => {
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const connect = async () => {
      socketRef.current = io(
        // "https://our-silences.online"
        "wss://our-silences.online"
        , {
        transports: ["polling"],
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      intervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvas || !ctx) return;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg");
        socketRef.current.emit("frame", { image: imageData });
      }, 100);

      socketRef.current.on("prediction", (data: { sentence: string }) => {
        onPrediction(data.sentence);
      });
    };

    if (isCameraOpen && videoRef.current) {
      connect();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraOpen]);

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  return { stopCamera };
};
