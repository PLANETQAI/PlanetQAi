import { NextResponse } from "next/server";
import { auth } from "./auth";

export const runtime = 'nodejs';

const CUSTOM_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "https://www.planetqproductions.com";

// Define paths that should be excluded from middleware processing
const EXCLUDED_PATHS = [
  "/api/auth/token", // <-- This route must be public
  "/main",
  "/api/stripe-webhook",
  "/api/credits/webhook",
  "/api/subscriptions/webhook",
  "/api/share",
  "/share",
  "/carousel-test",
  "/planetqgames",
  "/chat/avatar",
  "/test",
  "/public/models",
  "/models/CYBERHEAD.glb",
  "public/textures"
];

const ALLOWED_ORIGINS = [
  'http://localhost:3000', // Main app
  'http://localhost:3001', // Other app (local)
  'https://www.planetqradio.com', // Other app (production)
  process.env.NEXTAUTH_URL
].filter(Boolean);

// Define paths that should always be public and bypass authentication
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-account",
  "/suspended",
  "/api/auth", // All NextAuth.js API routes
  "/api/auth/callback", // Specific callback routes
  "/api/auth/session",
  "/api/auth/csrf",
  "/api/auth/providers",
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/error",
  "/api/auth/verify-request",
  "/api/auth/new-user",
  "/api/auth/token",
];

// Create a middleware handler that excludes webhook paths
export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  console.log(`Middleware: Pathname: ${pathname}, Authenticated: ${!!req.auth}`);

  // Allow public routes to bypass authentication
  if (PUBLIC_ROUTES.some((path) => pathname.startsWith(path))) {
    console.log(`Middleware: Bypassing auth for public route: ${pathname}`);
    return NextResponse.next();
  }

  const origin = req.headers.get("origin");
  const isAllowedOrigin = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || 
    (origin && origin.startsWith(allowed.replace(/^https?:\/\//, '')))
  );

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
      response.headers.set("Access-Control-Max-Age", "86400");
    }
    return response;
  }

  const isExcludedPath = EXCLUDED_PATHS.some(
    (path) => req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path + "/")
  );

  if (isExcludedPath) {
    const response = NextResponse.next();
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    return response;
  }

  const host = req.headers.get("host");

  // --- API Token Authentication ---
  // If NextAuth's cookie-based auth fails (req.auth is null), check for a
  // bearer token as a fallback for API clients on API routes.
  if (!req.auth && req.nextUrl.pathname.startsWith("/api/")) {
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (token) {
      try {
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        
        const { payload } = await jwtVerify(token, secret, {
          issuer: 'urn:planetqai:api',
          audience: 'urn:planetqai:api:client',
        });

        // Manually attach the user payload to req.auth to make it
        // compatible with the rest of the middleware logic (e.g., admin checks).
        req.auth = { user: payload };
      } catch (error) {
        console.error('Invalid API token:', error.message);
        // If a token is provided but is invalid or expired, deny access.
        return new NextResponse(JSON.stringify({ message: 'Authentication failed: Invalid or expired token.' }), { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    }
  }
  // --- End API Token Authentication ---

  // 🔒 Redirect all requests from vercel.app to your custom domain
  if (process.env.NODE_ENV !== "development" && host && host.includes("vercel.app")) {
    return NextResponse.redirect(`${CUSTOM_DOMAIN}${req.nextUrl.pathname}`);
  }

  // Check for admin routes and redirect if not an admin
  if ((req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/api/admin")) &&
      (!req.auth || req.auth.user?.role !== "Admin")) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  // Check for suspended users
  if (req.auth?.user?.isSuspended && req.nextUrl.pathname !== '/suspended') {
    return NextResponse.redirect(new URL('/suspended', req.nextUrl.origin));
  }

  // 🔐 Auth logic for protected routes
  if (!req.auth &&
      !isExcludedPath &&
      !["/login", "/signup", "/forgot-password", "/reset-password", "/verify-account", "/chat_v1", "/suspended"].includes(req.nextUrl.pathname) &&
      !req.nextUrl.pathname.startsWith("/share/")) {
    const redirectTo = req.nextUrl.pathname;
    return NextResponse.redirect(new URL(
      redirectTo ? `/login?redirectTo=${redirectTo}` : "/login",
      req.nextUrl.origin
    ));
  }

  // ✅ Allow request if all is fine
  const response = NextResponse.next();

  // Add CORS headers to all responses if not already set
  if (isAllowedOrigin && !response.headers.get('Access-Control-Allow-Origin')) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Expose-Headers", "Set-Cookie");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
  }

  return response;
});

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!api/auth|auth|images|api/link/getlink|videos/*|robot|aistudio|api/gallery/create|api/thumbnail/modifythumbnail|vidoes|_next/static|_next/image|favicon.ico|audio-processor.js|api/webhooks|api/stripe-webhook|api/credits/webhook|api/subscriptions/webhook|forgot-password|reset-password|verify-account|^/$|/share/).+)",
    "/admin/:path*",
  ],
};