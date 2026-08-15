import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/prisma';

export async function GET() {
  try {
    const isConnected = await testDatabaseConnection();

    return NextResponse.json({
      success: isConnected,
      message: isConnected
        ? 'Database connection successful'
        : 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Database test failed',
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
