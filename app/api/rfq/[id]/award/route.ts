import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supplierIds } = await req.json()

  if (!Array.isArray(supplierIds) || supplierIds.length === 0) {
    return NextResponse.json({ error: 'supplierIds array is required' }, { status: 400 })
  }

  await db.rFQResponse.updateMany({
    where: { orderId: id },
    data: { isSelected: false },
  })
  await db.rFQResponse.updateMany({
    where: { orderId: id, supplierId: { in: supplierIds } },
    data: { isSelected: true },
  })

  const order = await db.order.update({
    where: { id },
    data: { status: 'AWARDED', awardedTo: supplierIds },
    include: { rfqItems: true, responses: { include: { supplier: true } } },
  })

  return NextResponse.json(order)
}
