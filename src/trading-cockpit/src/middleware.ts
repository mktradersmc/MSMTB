import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Extract token from cookies
    const token = request.cookies.get('auth_token')?.value;

    // If no token and not on login page, redirect to /login
    if (!token && !request.nextUrl.pathname.startsWith('/login')) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // If token exists and on login page, redirect to dashboard
    if (token && request.nextUrl.pathname.startsWith('/login')) {
        const dashboardUrl = new URL('/', request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - images (public images path)
         * - favicon.ico, file.svg, window.svg, globe.svg (root static files)
         */
        '/((?!api|_next/static|_next/image|images|favicon.ico|file.svg|window.svg|globe.svg).*)',
    ],
};
