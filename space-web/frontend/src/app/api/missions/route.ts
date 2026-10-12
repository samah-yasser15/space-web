import { NextResponse } from 'next/server';
import { MISSIONS_DATA } from '@/lib/sampleTelemetry';

export async function GET() {
  return NextResponse.json({
    missions: MISSIONS_DATA
  });
}

