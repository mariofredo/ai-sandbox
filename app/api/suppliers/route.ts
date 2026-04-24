import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const suppliers = await db.supplier.findMany({
    include: { products: true },
    orderBy: { rating: 'desc' },
  })
  return NextResponse.json(suppliers)
}
