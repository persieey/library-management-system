import type { BookItem } from '../interface/IBookInterface'
import imgCover1 from '../assets/book-1.png'
import imgCover2 from '../assets/book-2.png'
import imgCover3 from '../assets/book-3.png'
import imgCover4 from '../assets/book-4.png'
import imgCover5 from '../assets/book-5.png'

// ยังไม่มีระบบจัดการหนังสือ (catalog) จริง — ใช้ข้อมูลตัวอย่างชุดเดียวกับที่โชว์บนหน้าแรก
export const BOOKS: BookItem[] = [
  {
    id: 1,
    image: imgCover1,
    title: 'Beneath Copper Skies',
    author: 'by Eme Savage',
    rating: '4.5 (198)',
    description:
      'A lone astronaut stranded on a copper-red world must find a way home before the twin suns set for the last time.',
  },
  {
    id: 2,
    image: imgCover2,
    title: 'The Lighthouse Keeper',
    author: 'by James Michael Pratt',
    rating: '4.8 (455)',
    description:
      "A quiet coastal town, an aging lighthouse keeper, and the secret that ties three generations together.",
  },
  {
    id: 3,
    image: imgCover3,
    title: 'Whispers in Autumn',
    author: 'by Trisha Leigh',
    rating: '4.2 (267)',
    description:
      "As the leaves turn, a girl discovers a hidden diary that unravels her family's forgotten past.",
  },
  {
    id: 4,
    image: imgCover4,
    title: "The Cartographer's Daughter",
    author: 'by Kiran Millwood Hargrave',
    rating: '3.9 (140)',
    description:
      "In a world of shifting maps and hidden kingdoms, a mapmaker's daughter sets out to chart a path no one has dared draw before.",
  },
  {
    id: 5,
    image: imgCover5,
    title: 'The Silent Orchard',
    author: 'by Elena Marsh',
    rating: '4.0 (312)',
    description:
      'A mysterious orchard holds the key to a decades-old disappearance, and only one visitor is brave enough to ask why.',
  },
]
