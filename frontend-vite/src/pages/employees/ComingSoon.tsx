import BackOfficeLayout from '../../components/BackOfficeLayout'

function ComingSoon({ title }: { title: string }) {
  return (
    <BackOfficeLayout title={title}>
      <div className="flex h-[400px] flex-col items-center justify-center gap-[10px] rounded-card border border-dashed border-line">
        <p className="font-kanit text-[22px] text-brand-green">{title}</p>
        <p className="font-kanit text-[15px] text-ink-muted">หน้านี้ยังไม่ได้ทำ — มีดีไซน์รออยู่ใน Figma แล้ว</p>
      </div>
    </BackOfficeLayout>
  )
}

export default ComingSoon
