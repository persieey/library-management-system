/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ยังไม่มีใน Figma Variables — เป็น local paint ของ header/footer
        // คงค่าเดิมไว้จนกว่าจะยืนยันว่ามี token ใหม่มาแทน
        brand: {
          green: "#12372f",
        },
        brown: {
          900: "#3b2a1e",
          700: "#6b4f3b",
          500: "#9c7f65",
        },
        terracotta: {
          600: "#c1592a",
        },
        gold: {
          200: "#f1d9a8",
        },
        cream: {
          50: "#fdf8f2",
        },
        ink: {
          DEFAULT: "#1a1a17",
          muted: "#5b5749",
        },
        accent: {
          green: "#2f5d3a",
          "green-light": "#e4ece1",
        },
        line: {
          DEFAULT: "#e3dacb",   // color/border
          subtle: "#e6d5be",    // border/subtle
        },
        placeholder: "#8e8e8e",
        surface: {
          muted: "#d9d9d9",
        },
      },
      fontFamily: {
        thai: ["'Noto Sans Thai'", "sans-serif"],
        kanit: ["Kanit", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        display: ["'Playfair Display'", "serif"],
      },
      fontSize: {
        // PR text styles จาก Figma
        caption: ["13px", { lineHeight: "1.4", letterSpacing: "2px", fontWeight: "500" }],
        "button-label": ["15px", { lineHeight: "1", fontWeight: "600" }],
        "card-title": ["18px", { lineHeight: "1.35", fontWeight: "600" }],
      },
      borderRadius: {
        card: "16px",
        thumb: "10px",
        pill: "20px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "pop-in": "pop-in 220ms ease-out",
      },
    },
  },
  plugins: [],
}
