import { NextRequest, NextResponse } from 'next/server';
import { generateClientTelemetryData } from '@/lib/sampleTelemetry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { values, threshold = 0.45, window_size = 100, stride = 5 } = body;

    if (!values || !Array.isArray(values) || values.length < 10) {
      return NextResponse.json(
        { error: 'Values array must contain at least 10 numbers' },
        { status: 400 }
      );
    }

    const data = generateClientTelemetryData(
      'CUSTOM',
      'STREAM',
      threshold,
      window_size,
      stride,
      values.length
    );

    return NextResponse.json(data.detection);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

