import { useState } from 'react'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-2xl p-8 flex items-center justify-center h-96">
        <span className="text-9xl">{images[selectedIndex]}</span>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`
                bg-gradient-to-br from-hamster-ivory to-hamster-beige
                rounded-lg p-4 flex items-center justify-center h-24
                transition-all hover:scale-105
                ${selectedIndex === index ? 'ring-4 ring-hamster-orange' : 'opacity-60 hover:opacity-100'}
              `}
            >
              <span className="text-4xl">{image}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
