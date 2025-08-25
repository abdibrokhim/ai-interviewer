import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { validateCsrfToken } from "@/lib/csrf"

export async function middleware(request: NextRequest) {
  // Update the user's session
  const response = await updateSession(request)

  // CSRF protection for state-changing requests
  if (["POST", "PUT", "DELETE"].includes(request.method)) {
    const csrfCookie = request.cookies.get("csrf_token")?.value
    const headerToken = request.headers.get("x-csrf-token")

    if (!csrfCookie || !headerToken || !validateCsrfToken(headerToken)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }
  }
  
  // If the response is a redirect, return it
  if (response.status === 307 || response.status === 308) {
    return response
  }

  const pathname = request.nextUrl.pathname

  // Role-based routing protection
  if (pathname.startsWith('/employer') || pathname.startsWith('/admin') || pathname.startsWith('/candidate')) {
    // We'll implement role checking in the layout components
    // since we can't access user role in middleware without making DB calls
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
  runtime: "nodejs",
}