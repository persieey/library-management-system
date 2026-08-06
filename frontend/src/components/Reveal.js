import { useEffect, useRef, useState } from "react";

// ค่อยๆ จางเข้ามาตอนเลื่อนถึง — เล่นครั้งเดียวแล้วเลิกเฝ้า
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // ผู้ใช้ที่ตั้งค่าลดการเคลื่อนไหวไว้ ให้ขึ้นเลยไม่ต้องมีอนิเมชั่น
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-[16px] opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Reveal;
