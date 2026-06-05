import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('aelia_auth', '', { maxAge: 0, path: '/' })
  return res
}

export async function GET() {
  const res = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000')
  )
  res.cookies.set('aelia_auth', '', { maxAge: 0, path: '/' })
  return res
}
