import { NextRequest, NextResponse } from 'next/server';

export function validateApiKey(req: NextRequest, expectedKey: string | undefined): NextResponse | null {
  if (!expectedKey) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
