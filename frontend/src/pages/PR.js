import { useEffect, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import CategoryCard from "../components/CategoryCard";
import Reveal from "../components/Reveal";

import imgBg from "../assets/hero-bg.jpg";
import imgThumbnail1 from "../assets/event-1.png";
import imgThumbnail2 from "../assets/event-2.png";
import imgThumbnail3 from "../assets/event-3.png";
import imgCover1 from "../assets/book-1.png";
import imgCover2 from "../assets/book-2.png";
import imgCover3 from "../assets/book-3.png";
import imgCover4 from "../assets/book-4.png";
import imgCover5 from "../assets/book-5.png";

import iconSearch from "../assets/icons/search.svg";
import iconBook from "../assets/icons/quick-book.svg";
import iconBookFill from "../assets/icons/quick-book-fill.svg";
import starFull from "../assets/icons/star-full.svg";
import starHalf from "../assets/icons/star-half.svg";

import iconFiction from "../assets/icons/cat-fiction.svg";
import iconNonFiction from "../assets/icons/cat-nonfiction.svg";
import iconScience from "../assets/icons/cat-science.svg";
import iconHistory from "../assets/icons/cat-history.svg";
import iconChildren from "../assets/icons/cat-children.svg";
import iconRomance from "../assets/icons/cat-romance.svg";
import iconMystery from "../assets/icons/cat-mystery.svg";
import iconBiography from "../assets/icons/cat-biography.svg";

// left = ตำแหน่ง x ใน Figma ลบขอบซ้ายของแถบ (220) — ดีไซน์วางมือ ระยะจึงไม่เท่ากัน
const quickLinks = [
  { icon: iconBook, label: "Books", to: "/books", left: 112 },
  { icon: iconBookFill, label: "eBooks", to: "/ebooks", left: 351 },
  { icon: iconBook, label: "Recording Room", to: "/recording-room", left: 601 },
  { icon: iconBookFill, label: "borrow", to: "/borrow", left: 856 },
];

const categories = [
  { icon: iconFiction, name: "Fiction", titles: "2,400 titles", to: "/category/fiction" },
  { icon: iconNonFiction, name: "Non-Fiction", titles: "1,850 titles", to: "/category/non-fiction" },
  { icon: iconScience, name: "Science", titles: "980 titles", to: "/category/science" },
  { icon: iconHistory, name: "History", titles: "1,120 titles", to: "/category/history" },
  { icon: iconChildren, name: "Children", titles: "1,560 titles", to: "/category/children" },
  { icon: iconRomance, name: "Romance", titles: "2,010 titles", to: "/category/romance" },
  { icon: iconMystery, name: "Mystery", titles: "1,340 titles", to: "/category/mystery" },
  { icon: iconBiography, name: "Biography", titles: "760 titles", to: "/category/biography" },
];

const events = [
  {
    img: imgThumbnail1,
    date: "12 Aug 2026 · 1:00 PM",
    title: "Academic Database Searching Training",
    location: "📍 Training Room, 2nd Floor, Central Library",
  },
  {
    img: imgThumbnail2,
    date: "18 Aug 2026 · All Day",
    title: "Monthly New Books Exhibition",
    location: "📍 Exhibition Zone, 1st Floor",
  },
  {
    img: imgThumbnail3,
    date: "25 Aug 2026 · 9:30 AM",
    title: "Citation and EndNote Workshop",
    location: "📍 Computer Lab, 3rd Floor",
  },
];

const books = [
  { img: imgCover1, title: "Beneath Copper Skies", author: "by Eme Savage", rating: "4.5 (198)" },
  { img: imgCover2, title: "The Lighthouse Keeper", author: "by James Michael Pratt", rating: "4.8 (455)" },
  { img: imgCover3, title: "Whispers in Autumn", author: "by Trisha Leigh", rating: "4.2 (267)" },
  { img: imgCover4, title: "The Cartographer's Daughter", author: "by Kiran Millwood Hargrave", rating: "3.9 (140)" },
  { img: imgCover5, title: "The Silent Orchard", author: "by Elena Marsh", rating: "4.0 (312)" },
];

function Stars() {
  return (
    <span className="flex items-start gap-[2px]">
      {[0, 1, 2, 3].map((i) => (
        <img key={i} src={starFull} alt="" className="h-[14px] w-[14px]" />
      ))}
      <img src={starHalf} alt="" className="h-[14px] w-[14px]" />
    </span>
  );
}

function HeroSection() {
  // จางเข้าตอนโหลดหน้า — ไล่ทีละชิ้น
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const fade = `transition-opacity duration-[900ms] ease-out motion-reduce:transition-none ${
    ready ? "opacity-100" : "opacity-0"
  }`;

  return (
    <div className="relative h-[960px] w-full overflow-clip">
      <img src={imgBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-brand-green opacity-60" />

      <div className="relative mx-auto h-full max-w-[1440px]">
        <h1
          className={`absolute left-1/2 top-[195px] -translate-x-1/2 whitespace-nowrap font-inter text-[60px] text-white ${fade}`}
        >
          How can we help?
        </h1>

        <div
          style={{ transitionDelay: "150ms" }}
          className={`absolute left-1/2 top-[332px] flex h-[40px] w-[600px] -translate-x-1/2 items-center justify-between rounded-[50px] bg-surface-muted pl-[20px] pr-[21px] ${fade}`}
        >
          <span className="font-inter text-[14px] text-placeholder">Search</span>
          <img src={iconSearch} alt="" className="h-[17px] w-[17px]" />
        </div>

        <div
          style={{ transitionDelay: "300ms" }}
          className={`absolute left-[220px] top-[479px] h-[150px] w-[1000px] bg-brand-green/95 ${fade}`}
        >
          {quickLinks.map((link) => (
            <a
              key={link.label}
              href={link.to}
              className="absolute top-[36px] flex w-[50px] flex-col items-center"
              style={{ left: `${link.left}px` }}
            >
              <img src={link.icon} alt="" className="h-[50px] w-[50px]" />
              <span className="absolute top-[59px] whitespace-nowrap font-kanit text-[11px] text-white">
                {link.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategorySection() {
  return (
    <section className="w-full bg-cream-50">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-[40px] px-[64px] py-[80px]">
        <Reveal>
          <div className="flex flex-col items-center gap-[10px]">
            <h2 className="font-inter text-[32px] font-semibold text-brown-900">Browse by Category</h2>
            <p className="font-inter text-[16px] text-brown-700">
              Find your favorite genre and explore curated collections
            </p>
          </div>
        </Reveal>

        <div className="flex w-full flex-col gap-[20px]">
          <div className="flex gap-[20px]">
            {categories.slice(0, 4).map((category, i) => (
              <Reveal key={category.name} className="flex-1" delay={i * 70}>
                <CategoryCard {...category} />
              </Reveal>
            ))}
          </div>
          <div className="flex gap-[20px]">
            {categories.slice(4).map((category, i) => (
              <Reveal key={category.name} className="flex-1" delay={i * 70}>
                <CategoryCard {...category} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EventSection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-[40px] px-[64px] py-[88px]">
        <Reveal>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[8px]">
              <h2 className="font-kanit text-[36px] font-bold leading-[1.25] text-ink">Event Announcements</h2>
              <p className="font-inter text-[16px] leading-[1.6] text-ink-muted">
                Upcoming events and training workshops from the library
              </p>
            </div>
            <a href="/events" className="font-thai text-button-label text-accent-green">
              View All →
            </a>
          </div>
        </Reveal>

        <div className="flex gap-[24px]">
          {events.map((event, i) => (
            <Reveal key={event.title} delay={i * 90}>
              <article className="flex h-full w-[384px] flex-col gap-[16px] rounded-card border border-line bg-white px-[24px] py-[28px] transition-shadow duration-300 hover:shadow-[0_6px_18px_rgba(26,26,23,0.12)]">
                <img src={event.img} alt="" className="h-[140px] w-full rounded-thumb object-cover" />
                <span className="w-fit rounded-pill bg-accent-green-light px-[12px] py-[5px] font-thai text-caption text-accent-green">
                  {event.date}
                </span>
                <h3 className="font-thai text-card-title text-ink">{event.title}</h3>
                <p className="font-thai text-[13px] font-medium leading-[1.4] text-ink-muted">{event.location}</p>
                <a href="/events" className="font-thai text-button-label text-accent-green">
                  View Details →
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecommendedBooks() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-[40px] px-[64px] py-[80px]">
        <Reveal>
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-[10px]">
              <h2 className="font-kanit text-[48px] font-semibold text-brown-900">Recommended for You</h2>
              <p className="font-inter text-[16px] text-brown-700">
                Handpicked titles based on what readers love this month
              </p>
            </div>
            <a href="/books" className="font-inter text-[14px] font-semibold text-terracotta-600">
              View All
            </a>
          </div>
        </Reveal>

        <div className="flex gap-[24px]">
          {books.map((book, i) => (
            <Reveal key={book.title} className="flex-1" delay={i * 70}>
              <article
                className="flex h-full w-full flex-col gap-[14px] rounded-card border border-line-subtle bg-white px-[16px] pb-[20px] pt-[16px] transition-shadow duration-300 hover:shadow-[0_6px_18px_rgba(59,42,30,0.12)]"
              >
                <img src={book.img} alt="" className="h-[300px] w-full rounded-thumb object-cover" />
                <div className="flex items-center gap-[3px]">
                  <Stars />
                  <span className="font-inter text-[12px] text-brown-700">{book.rating}</span>
                </div>
                <h3 className="font-display text-[17px] font-semibold leading-[22px] text-brown-900">
                  {book.title}
                </h3>
                <p className="font-inter text-[13px] text-brown-500">{book.author}</p>
                <div className="mt-auto flex justify-end">
                  <button
                    type="button"
                    className="rounded-[8px] bg-cream-50 px-[14px] py-[8px] font-inter text-[12px] font-semibold text-brown-900"
                  >
                    View
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PR() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <CategorySection />
      <EventSection />
      <RecommendedBooks />
      <Footer />
    </div>
  );
}

export default PR;
