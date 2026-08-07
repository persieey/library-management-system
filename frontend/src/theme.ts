import { createTheme } from '@mui/material/styles'

// สีทั้งหมดยกมาจาก Figma Variables ของไฟล์ออกแบบ
export const colors = {
  brandGreen: '#12372f',
  brown900: '#3b2a1e',
  brown700: '#6b4f3b',
  brown500: '#9c7f65',
  terracotta600: '#c1592a',
  gold200: '#f1d9a8',
  cream50: '#fdf8f2',
  ink: '#1a1a17',
  inkMuted: '#5b5749',
  accentGreen: '#2f5d3a',
  accentGreenLight: '#e4ece1',
  border: '#e3dacb',
  borderSubtle: '#e6d5be',
  placeholder: '#8e8e8e',
  surfaceMuted: '#d9d9d9',
} as const

export const fonts = {
  kanit: "'Kanit', sans-serif",
  inter: "'Inter', sans-serif",
  display: "'Playfair Display', serif",
  thai: "'Noto Sans Thai', sans-serif",
} as const

const theme = createTheme({
  palette: {
    primary: { main: colors.brandGreen },
    secondary: { main: colors.terracotta600 },
    background: { default: '#ffffff' },
    text: { primary: colors.ink, secondary: colors.inkMuted },
  },
  typography: {
    fontFamily: fonts.kanit,
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none' } },
    },
  },
})

export default theme
