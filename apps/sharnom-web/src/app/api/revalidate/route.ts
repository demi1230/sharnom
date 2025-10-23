import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// On-demand revalidation API route for SSG pages
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const path = request.nextUrl.searchParams.get('path');
  const tag = request.nextUrl.searchParams.get('tag');

  // Verify secret token
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  // Revalidate by path
  if (path) {
    try {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path, now: Date.now() });
    } catch (err) {
      return NextResponse.json({ message: 'Error revalidating path', error: String(err) }, { status: 500 });
    }
  }

  // Revalidate by tag
  if (tag) {
    try {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, tag, now: Date.now() });
    } catch (err) {
      return NextResponse.json({ message: 'Error revalidating tag', error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Missing path or tag parameter' }, { status: 400 });
}
