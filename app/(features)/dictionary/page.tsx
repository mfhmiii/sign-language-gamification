import Image from "next/image"
import { Search, Mic, ArrowLeft } from "lucide-react"
import WordList from "@/components/list"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-green-200 pb-8 rounded-b-3xl">
        <div className="container mx-auto px-4 pt-4">
          <div className="flex items-center gap-4 mb-6">
            <button className="p-1">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Kamus Bahasa Isyarat</h1>
          </div>

          <div className="flex">
            <div className="w-3/5">
              <p className="text-xl font-medium mb-4">Belajar dari kamus bahasa isyarat untuk menyelesaikan quis!</p>
            </div>
            <div className="w-2/5 relative">
              <Image
                src="/placeholder.svg?height=150&width=150"
                alt="Person illustration"
                width={150}
                height={150}
                className="absolute bottom-0 right-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        <div className="flex gap-2 mb-6">
          <div className="bg-gray-200 rounded-full flex items-center px-4 py-2 flex-1">
            <input type="text" placeholder="Cari Kosa Kata" className="bg-transparent w-full focus:outline-none" />
          </div>
          <button className="bg-gray-200 rounded-full p-3">
            <Search size={20} />
          </button>
          <button className="bg-gray-200 rounded-full p-3">
            <Mic size={20} />
          </button>
        </div>

        <WordList />
      </div>
    </main>
  )
}

