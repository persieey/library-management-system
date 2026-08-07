import type { PRItem } from './PRCard'

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// เปิดหน้าต่างแยกแล้วสั่งพิมพ์เฉพาะข่าวใบนี้ใบเดียว ไม่ใช่ทั้งหน้าจัดการ
export function printPRItem(item: PRItem) {
  const win = window.open('', '_blank', 'width=480,height=640')
  if (!win) return

  win.document.write(`<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(item.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600&display=swap" rel="stylesheet" />
<style>
  body { font-family: 'Noto Sans Thai', sans-serif; padding: 32px; color: #1a1a17; }
  h1 { font-size: 20px; margin-bottom: 8px; }
  .meta { font-size: 13px; color: #5b5749; margin-bottom: 16px; }
  hr { border: none; border-top: 1px solid #e3dacb; margin: 16px 0; }
  .content { font-size: 15px; line-height: 1.6; white-space: pre-wrap; }
</style>
</head>
<body>
  <h1>${escapeHtml(item.title)}</h1>
  <p class="meta">
    สถานะ: ${escapeHtml(item.status)} · ช่องทาง: ${escapeHtml(item.channel)}<br />
    เผยแพร่: ${escapeHtml(item.publishedAt)} &nbsp;&nbsp; ปลด: ${escapeHtml(item.expiresAt)}
  </p>
  <hr />
  <p class="content">${escapeHtml(item.content || 'ยังไม่มีเนื้อหา')}</p>
</body>
</html>`)
  win.document.close()
  win.focus()
  win.onload = () => win.print()
}
