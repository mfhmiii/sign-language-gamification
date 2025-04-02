"use client";

import Image from "next/image";
import { Search, Mic, ArrowLeft } from "lucide-react";
import List from "@/components/list";
import { useState } from "react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
          <div className="bg-white rounded-xl shadow-lg p-2 mb-6 flex gap-2">
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

          <List searchQuery={searchTerm} />
        </div>
      </div>
    </main>
  );
}
