import { NextRequest, NextResponse } from 'next/server';
import { extractWindowFeatures } from '@/lib/sampleTelemetry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { window_values } = body;

    if (!window_values || !Array.isArray(window_values)) {
      return NextResponse.json(
        { error: 'window_values array must be provided' },
        { status: 400 }
      );
    }

    const features = extractWindowFeatures(window_values);
    return NextResponse.json({
      window_length: window_values.length,
      features
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

