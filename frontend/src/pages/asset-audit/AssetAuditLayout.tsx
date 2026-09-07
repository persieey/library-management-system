import SystemLayout from '../../components/SystemLayout'

interface Props {
  title: string
  children: React.ReactNode
}

export default function AssetAuditLayout({ title, children }: Props) {
  return (
    <SystemLayout title={title} trail={[{ label: 'ระบบตรวจนับสินทรัพย์', to: '/asset-audit' }]}>
      {children}
    </SystemLayout>
  )
}
