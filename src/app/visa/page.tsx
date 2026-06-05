export default function VisaPage() {
  return (
    <iframe
      src="/api/tool/visa"
      title="Visa"
      style={{ display:'block', width:'100%', height:'calc(100vh - 44px)', border:'none' }}
      allow="clipboard-write"
    />
  )
}
