import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: "HEALTHY",
    telemetry_stream: "ACTIVE",
    detector_loaded: true,
    platform: "Vercel Serverless Edge",
    default_threshold: 0.45,
    window_size: 100,
    stride: 5
  });
}

