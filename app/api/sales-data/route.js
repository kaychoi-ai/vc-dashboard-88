import { dataService } from '../../../lib/providers/DataService.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await dataService.getSalesData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Data Layer Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}
