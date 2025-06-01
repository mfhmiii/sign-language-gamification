"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { updateDictionaryDiverMission } from "@/app/(features)/mission/actions";

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

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
      await updateDictionaryDiverMission(user.id);

      // Close camera and modal after successful submission
      setIsCameraOpen(false);
      onClose();
    } catch (error) {
      console.error("Error updating progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-xl font-bold">{word.value}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          {!isCameraOpen ? (
            <div className="space-y-4">
              {word.videoUrl && (
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <video
                    src={word.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <button
                onClick={() => setIsCameraOpen(true)}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Peragakan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                {/* Camera placeholder - in real implementation, this would be the camera feed */}
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCameraOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Tutup Kamera
                </button>
                <button
                  onClick={handleGestureSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Cek"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
