import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: supplierId } = await params
  const { orderId, canSupply, notes, items } = await req.json()

  if (!orderId || canSupply === undefined) {
    return NextResponse.json({ error: 'orderId and canSupply are required' }, { status: 400 })
  }

  const assignment = await db.rFQAssignment.findUnique({
    where: { orderId_supplierId: { orderId, supplierId } },
  })
  if (!assignment) {
    return NextResponse.json({ error: 'Supplier not assigned to this RFQ' }, { status: 403 })
  }

  const totalPrice = Array.isArray(items)
    ? items.reduce((sum: number, i: { totalPrice: number }) => sum + (i.totalPrice ?? 0), 0)
    : null

  const response = await db.rFQResponse.upsert({
    where: { orderId_supplierId: { orderId, supplierId } },
    update: { canSupply, notes: notes ?? null, totalPrice, items: items ?? null },
    create: { orderId, supplierId, canSupply, notes: notes ?? null, totalPrice, items: items ?? null },
  })

  await db.rFQAssignment.update({
    where: { orderId_supplierId: { orderId, supplierId } },
    data: { status: 'RESPONDED' },
  })

  return NextResponse.json(response)
}
