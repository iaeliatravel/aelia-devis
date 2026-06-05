import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const TOOLS: Record<string, string> = {
  visa:        'visa.html',
  omra:        'omra.html',
  billetterie: 'billetterie.html',
  attestation: 'attestation.html',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { name: string } }
) {
  const fileName = TOOLS[params.name]
  if (!fileName) return new NextResponse('Not found', { status: 404 })

  try {
    const html = readFileSync(join(process.cwd(), 'tools', fileName), 'utf-8')
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:3rem;color:#666;background:#F7F5F0">
        <h2 style="color:#C96A2E">Outil indisponible</h2>
        <p style="margin-top:1rem">Le fichier <code>tools/${fileName}</code> est introuvable.<br>
        Vérifiez que le dossier <code>tools/</code> est bien présent à la racine du projet et commité sur Git.</p>
      </body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}
