export default function AttestationPage() {
  return (
    <iframe
      src="/api/tool/attestation"
      title="Attestation"
      style={{ display:'block', width:'100%', height:'calc(100vh - 44px)', border:'none' }}
      allow="clipboard-write"
    />
  )
}
