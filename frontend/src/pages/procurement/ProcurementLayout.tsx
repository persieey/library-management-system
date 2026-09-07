import SystemLayout from '../../components/SystemLayout'

interface Props {
  title: string
  children: React.ReactNode
}

export default function ProcurementLayout({ title, children }: Props) {
  return (
    <SystemLayout title={title} trail={[{ label: 'ระบบจัดซื้อ', to: '/procurement' }]}>
      {children}
    </SystemLayout>
  )
}
