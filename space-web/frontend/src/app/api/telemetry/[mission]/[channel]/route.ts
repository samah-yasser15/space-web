import { NextRequest, NextResponse } from 'next/server';
import { generateClientTelemetryData } from '@/lib/sampleTelemetry';

export async function GET(
  request: NextRequest,
  { params }: { params: { mission: string; channel: string } }
) {
  const { mission, channel } = params;
  const searchParams = request.nextUrl.searchParams;
  const threshold = parseFloat(searchParams.get('threshold') || '0.45');
  const windowSize = parseInt(searchParams.get('window_size') || '100', 10);
  const stride = parseInt(searchParams.get('stride') || '5', 10);
  const nPoints = parseInt(searchParams.get('n_points') || '1200', 10);

  const data = generateClientTelemetryData(
    mission.toUpperCase(),
    channel.toUpperCase(),
    threshold,
    windowSize,
    stride,
    nPoints
  );

  return NextResponse.json(data);
}

