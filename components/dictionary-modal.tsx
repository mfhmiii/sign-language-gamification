"use client";

import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  updateDictionaryDiverMission,
  updateWordWarriorMission,
} from "@/app/(features)/misi/actions";
import { useGestureSocket } from "@/hooks/useGestureSocket";

type DictionaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  word: {
    id: string;
    value: string;
    videoUrl?: string;
  };
  progressPoint: number;
};

export default function DictionaryModal({
  isOpen,
  onClose,
  word,
  progressPoint,
}: DictionaryModalProps) {
  const [showCameraPermission, setShowCameraPermission] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [predictionText, setPredictionText] = useState("Menunggu prediksi...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  // Use the gesture socket hook
  const { stopCamera } = useGestureSocket(
    isCameraOpen,
    videoRef,
    canvasRef,
    (sentence) => {
      setPredictionText("📜 " + sentence);
      
      // Since dictionary.value is always a single word, we can check if it appears in the sentence
      if (word && word.value) {
        // Split the sentence into words and check if any word matches the dictionary value
        const words = sentence.toLowerCase().split(/\s+/);
        const dictionaryValue = word.value.toLowerCase();
        
        if (words.includes(dictionaryValue)) {
          // If there's a match, automatically trigger the handleGestureSubmit function
          // But only if we're not already loading
          if (!isLoading) {
            handleGestureSubmit();
          }
        }
      }
    }
  );

  if (!isOpen) return null;

  const handleGestureSubmit = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // First check if progress record exists
      const { data: existingProgress } = await supabase
        .from("user_dictionary_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("dictionary_id", word.id)
        .single();

      if (existingProgress) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_dictionary_progress")
          .update({
            progress_point: progressPoint + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProgress.id);

        if (updateError) throw updateError;
      } else {
        // Create new progress record with UUID
        const { error: insertError } = await supabase
          .from("user_dictionary_progress")
          .insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            dictionary_id: word.id,
            progress_point: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      // Update Dictionary Diver mission progress
      // This is in a separate try-catch to ensure it runs even if there's an error above
      try {
        await updateDictionaryDiverMission(user.id);
        // Also update Word Warrior mission progress
        await updateWordWarriorMission(user.id);
      } catch (missionError) {
        console.error("Error updating missions:", missionError);
        // Continue execution even if mission update fails
      }

      // Close camera and modal after successful submission
      handleCloseCamera();
      onClose();
    } catch (error) {
      console.error("Error updating progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseCamera = () => {
    stopCamera(); // Stop the camera and socket connection
    setIsCameraOpen(false);
    setShowCameraPermission(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 flex justify-end items-center">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-6">
          {!showCameraPermission ? (
            <div className="space-y-4 flex flex-col items-center">
              {word.videoUrl && (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-blue-600">
                  <div className="relative w-full h-full">
                    <video
                      src={word.videoUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="text-center mt-2 mb-4">
                <h3 className="text-xl font-bold">"{word.value}"</h3>
              </div>
              <button
                onClick={() => setShowCameraPermission(true)}
                className="bg-amber-400 text-white py-2 px-6 rounded-full font-medium hover:bg-amber-500 transition-colors"
              >
                Peragakan
              </button>
            </div>
          ) : !isCameraOpen ? (
            <div className="space-y-4 flex flex-col items-center py-8">
              <div className="w-24 h-24 rounded-full bg-green-200 flex items-center justify-center">
                <Camera className="w-10 h-10 text-green-800" />
              </div>
              <button
                onClick={() => setIsCameraOpen(true)}
                className="bg-green-500 text-white py-2 px-6 rounded-full font-medium hover:bg-green-600 transition-colors mt-4"
              >
                Buka Kamera
              </button>
              <div className="text-center mt-6">
                <h3 className="text-xl font-bold">"{word.value}"</h3>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col items-center">
              <div className="aspect-square xl:aspect-video w-full rounded-lg overflow-hidden bg-slate-100 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* Display prediction text */}
                <div className="absolute top-4 left-4 bg-black/70 text-white text-sm p-2 rounded">
                  {predictionText}
                </div>

                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={handleGestureSubmit}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "Menyimpan..." : "Cek"}
                  </button>
                  <button
                    onClick={handleCloseCamera}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded font-medium"
                  >
                    Tutup Kamera
                  </button>
                </div>
              </div>

              <div className="text-center mt-2 mb-4">
                <h3 className="text-xl font-bold">"{word.value}"</h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
