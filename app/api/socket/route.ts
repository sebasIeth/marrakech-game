import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'Socket.IO server running on custom server' });
}
