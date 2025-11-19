import { auth0 } from '@/lib/auth/auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ auth0: string[] }> }
) {
  const { auth0: segments } = await params;
  const action = segments?.[0] || 'login';

  try {
    // Handle login
    if (action === 'login') {
      const returnTo = req.nextUrl.searchParams.get('returnTo') || '/';
      return auth0.startInteractiveLogin({
        returnTo,
      });
    }

    // Handle logout
    if (action === 'logout') {
      // For now, just redirect to home
      // You'll need to implement proper logout
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Handle callback
    if (action === 'callback') {
      // Handle the callback after successful authentication
      const callbackUrl = new URL(req.url);
      // Process the callback and redirect
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.json({ error: 'Invalid auth action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
