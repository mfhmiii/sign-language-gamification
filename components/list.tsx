"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

type Word = {
  id: number
  word: string
}

export default function List() {
  const [words] = useState<Word[]>([
    { id: 1, word: "Makan" },
    { id: 2, word: "Aku" },
    { id: 3, word: "Maki" },
  ])

  return (
    <div className="space-y-4">
      {words.map((word) => (
        <Card key={word.id} className="bg-amber-400 text-white rounded-xl">
          <CardContent className="p-4 flex justify-between items-center">
            <span className="text-2xl font-bold">{word.word}</span>
            <button className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-sm font-medium">Lihat</button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

