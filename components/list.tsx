"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionaryWords } from "@/app/actions";

type DictionaryWord = {
  id: string;
  value: string;
  videoUrl?: string;
};

export default function List({ searchQuery = "" }: { searchQuery?: string }) {
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        setLoading(true);
        const data = await getDictionaryWords(searchQuery);
        if (Array.isArray(data)) {
          setWords(data);
        } else {
          setWords([]);
        }
      } catch (error) {
        setWords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : words && words.length > 0 ? (
        words.map((word) => (
          <Card key={word?.id} className="bg-amber-400 text-white rounded-xl">
            <CardContent className="p-4 flex justify-between items-center">
              <span className="text-2xl font-bold">
                {word?.value || "No value"}
              </span>
              <button className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-sm font-medium">
                Lihat
              </button>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-4">No words found</div>
      )}
    </div>
  );
}
