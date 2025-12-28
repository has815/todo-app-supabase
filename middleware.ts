// middleware.ts (root folder mein – app/ ke bahar)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Response ko modify karne ke liye banaya
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Supabase client create karo (SSR ke liye)
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

  // Session get karo (refresh bhi karega agar zarurat padi)
  await supabase.auth.getSession()

  const { data: { session } } = await supabase.auth.getSession()

  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Middleware: Admin route accessed →', request.nextUrl.pathname)

    if (!session) {
      console.log('No session → redirect to /signin')
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    // Profile fetch karo role check ke liye
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

  // Normal response return karo
  return response
}

// Config: sirf /admin routes pe middleware chalega
export const config = {
  matcher: '/admin/:path*',
}