// Small round initials badge used in staff table rows and the account chip.

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// deterministic hue from the name so the same person keeps the same colour
function hue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default function Avatar({
  name,
  size = 34,
}: {
  name: string | undefined | null;
  size?: number;
}) {
  const label = name && name.trim() ? name : "?";
  const h = hue(label);
  return (
    <span
      className="staff-avatar-badge-round"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: `hsl(${h} 45% 88%)`,
        color: `hsl(${h} 55% 32%)`,
      }}
      aria-hidden="true"
    >
      {initials(label)}
    </span>
  );
}
