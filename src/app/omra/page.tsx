export default function OmraPage() {
  return (
    <iframe
      src="/api/tool/omra"
      title="Omra"
      style={{ display:'block', width:'100%', height:'calc(100vh - 44px)', border:'none' }}
      allow="clipboard-write"
    />
  )
}
