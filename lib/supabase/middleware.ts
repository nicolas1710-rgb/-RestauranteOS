import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const isMock = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

    if (isMock) {
        const mockUserId = request.cookies.get('mock_user_id')?.value
        const pathname = request.nextUrl.pathname
        const publicPaths = ['/login']

        if (publicPaths.some(p => pathname.startsWith(p))) {
            return supabaseResponse
        }

        if (!mockUserId) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        return supabaseResponse
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Allow public paths
    const publicPaths = ['/login']
    if (publicPaths.some(p => pathname.startsWith(p))) {
        return supabaseResponse
    }

    // Redirect to login if no session
    if (!user && !pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
