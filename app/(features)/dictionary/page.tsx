"use client";

import Image from "next/image";
import { Search, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import DictionaryModal from "@/components/dictionary-modal";

type DictionaryProgress = {
  id: string;
  value: string;
  videoUrl?: string;
  progressPoint: number;
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dictionaryItems, setDictionaryItems] = useState<DictionaryProgress[]>(
    []
  );
  const [selectedWord, setSelectedWord] = useState<DictionaryProgress | null>(
    null
  );
  const supabase = createClient();

  useEffect(() => {
    const fetchDictionaryProgress = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // First, get all dictionary items
        const { data: dictionaryData, error: dictionaryError } = await supabase
          .from("dictionary")
          .select("id, value, video_url");

        if (dictionaryError) throw dictionaryError;

        // Get user's progress for these items
        const { data: progressData, error: progressError } = await supabase
          .from("user_dictionary_progress")
          .select("*")
          .eq("user_id", user.id);

        if (progressError && progressError.code !== "PGRST116") {
          throw progressError;
        }

        // Create progress records for items without progress
        if (dictionaryData) {
          const existingProgressMap = new Map(
            progressData?.map((p) => [p.dictionary_id, p.progress_point]) || []
          );

          const newProgressRecords = dictionaryData
            .filter((item) => !existingProgressMap.has(item.id))
            .map((item) => ({
              id: crypto.randomUUID(),
              user_id: user.id,
              dictionary_id: item.id,
              progress_point: 0,
            }));

          if (newProgressRecords.length > 0) {
            const { error: insertError } = await supabase
              .from("user_dictionary_progress")
              .insert(newProgressRecords);

            if (insertError) {
              console.error("Error creating dictionary progress:", insertError);
            }
          }

          // Map the dictionary items with their progress
          setDictionaryItems(
            dictionaryData.map((item) => ({
              id: item.id,
              value: item.value,
              videoUrl: item.video_url,
              progressPoint: existingProgressMap.get(item.id) || 0,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching dictionary progress:", error);
      }
    };

    fetchDictionaryProgress();
  }, [supabase]);

  const handleSearch = () => {
    setSearchTerm(searchQuery.toLowerCase());
  };

  return (
    <main className="pt-8 md:pt-10 min-h-screen flex flex-col">
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between md:justify-around px-4 md:px-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Kamus Bahasa Isyarat
            </h2>
            <p className="text-lg md:text-xl font-semibold">
              Belajar dari kamus bahasa isyarat untuk menyelesaikan quis!
            </p>
          </div>
          <Image
            src="/images/mission.svg"
            alt="Mascot"
            width={150}
            height={150}
            className="w-36 h-36 md:w-56 md:h-56"
          />
        </div>

        <div className="bg-white container mx-auto px-4 rounded-t-3xl pb-10 flex-1">
          <div className="bg-white rounded-xl shadow-lg p-2 mb-6 flex gap-2 mt-4">
            <div className="bg-gray-100 rounded-full flex items-center px-4 py-2 flex-1">
              <input
                type="text"
                placeholder="Cari Kosa Kata"
                className="bg-transparent w-full focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </div>
            <button
              className="bg-gray-100 rounded-full p-3 hover:bg-gray-200 transition-colors"
              onClick={handleSearch}
            >
              <Search size={20} className="text-gray-600" />
            </button>
            <button className="bg-gray-100 rounded-full p-3 hover:bg-gray-200 transition-colors">
              <Mic size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {dictionaryItems
                .filter((item) =>
                    item.value.toLowerCase().includes(searchTerm)
                )
                .map((item) => (
                    <div
                        key={item.id}
                        className="bg-amber-400 rounded-xl p-4 text-white"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xl font-bold">{item.value}</span>
                            <button
                                onClick={() => setSelectedWord(item)}
                                className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                Lihat
                            </button>
                        </div>
                        <div className="bg-white rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-amber-500 h-full transition-all duration-300"
                                style={{ width: `${(item.progressPoint / 5) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
          </div>
        </div>
      </div>

      {selectedWord && (
        <DictionaryModal
          isOpen={true}
          onClose={() => setSelectedWord(null)}
          word={{
            id: selectedWord.id,
            value: selectedWord.value,
            videoUrl: selectedWord.videoUrl,
          }}
          progressPoint={selectedWord.progressPoint}
        />
      )}
    </main>
  );
}
