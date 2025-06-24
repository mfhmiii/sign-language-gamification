import Image from "next/image"

type QuoteCardProps = {
  quote: string
  author: string
  className?: string
}

export default function QuoteCard({ quote, author, className = "" }: QuoteCardProps) {
  return (
    <div className={`bg-green-300 rounded-xl p-5 relative min-h-[180px] sm:min-h-[200px] ${className}`}>
      <div className="max-w-[70%] sm:max-w-[65%] md:max-w-[60%]">
        <p className="text-gray-800 text-2xl md:text-3xl font-medium leading-tight mb-2">{quote}</p>
        {/* <p className="text-gray-600 text-sm md:text-md font-normal leading-tight"> - {author}</p> */}
      </div>
      <div className="absolute right-0 bottom-0 ml-2">
        <Image
          src="/images/quotes.svg"
          alt=""
          width={120}
          height={120}
          className="md:w-40 md:h-40 lg:w-44 lg:h-44 object-contain"
          priority
        />
      </div>
    </div>
  )
}

