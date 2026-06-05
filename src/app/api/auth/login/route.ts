import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'aelia_auth'

function getUsers() {
  const raw = process.env.AUTH_USERS || 'admin|aelia2024'
  return raw.split(',').map(u => {
    const [user, pass] = u.split('|')
    return { user: (user || '').trim(), pass: (pass || '').trim() }
  }).filter(u => u.user && u.pass)
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json() as { username: string; password: string }
    const users  = getUsers()
    const secret = process.env.SESSION_SECRET || 'aelia_change_this_secret'
    const valid  = users.some(u => u.user === username && u.pass === password)

    if (!valid) {
      return NextResponse.json({ error: 'Identifiant ou mot de passe incorrect' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, secret, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 30,
      path:     '/',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
}
