// middleware.ts (ROOT folder mein – app/ ke bahar)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Middleware: Admin route accessed →', request.nextUrl.pathname)

    if (!session) {
      console.log('No session → redirect to /signin')
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    console.log('Profile query result:', profile, 'Error:', error)

    if (profile?.role !== 'admin') {
      console.log('Not admin → redirect to /')
      return NextResponse.redirect(new URL('/', request.url))
    }

    console.log('Admin access granted')
  }

  return response
}

export const config = {
  matcher: '/admin/:path*', // sirf /admin routes protect karega
}