
import { NextResponse } from 'next/server';
import { seedDemoData } from '@/lib/seed';

export async function GET() {
  try {
    await seedDemoData();
    return NextResponse.json({ message: 'Seeded successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
