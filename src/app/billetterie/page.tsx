export default function BilletteriePage() {
  return (
    <iframe
      src="/api/tool/billetterie"
      title="Billetterie"
      style={{ display:'block', width:'100%', height:'calc(100vh - 44px)', border:'none' }}
      allow="clipboard-write"
    />
  )
}
