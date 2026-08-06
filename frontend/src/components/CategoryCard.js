import { Link } from "react-router-dom";

// Figma CategoryCard (90:457) — "A single browsable book category with icon, name, and title count."
function CategoryCard({ icon, name, titles, to }) {
  return (
    <Link
      to={to}
      className="flex h-full w-full flex-col items-center gap-[12px] rounded-card border border-line-subtle bg-white px-[16px] pb-[24px] pt-[28px] transition-shadow duration-300 hover:shadow-[0_6px_18px_rgba(59,42,30,0.12)]"
    >
      <span className="flex h-[52px] w-[52px] items-center justify-center overflow-clip rounded-full bg-gold-200">
        <img src={icon} alt="" className="h-[24px] w-[24px]" />
      </span>
      <span className="font-display text-[17px] font-semibold text-brown-900">{name}</span>
      <span className="font-inter text-[13px] text-brown-700">{titles}</span>
    </Link>
  );
}

export default CategoryCard;
