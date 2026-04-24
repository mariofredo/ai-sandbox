import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const assignments = await db.rFQAssignment.findMany({
    where: { supplierId: id },
    include: { order: { include: { rfqItems: true } } },
    orderBy: { notifiedAt: 'desc' },
  })

  const orderIds = assignments.map((a) => a.orderId)
  const responses = await db.rFQResponse.findMany({
    where: { supplierId: id, orderId: { in: orderIds } },
  })
  const respondedSet = new Set(responses.map((r) => r.orderId))

  const result = assignments.map((a) => ({
    ...a,
    hasResponded: respondedSet.has(a.orderId),
    response: responses.find((r) => r.orderId === a.orderId) ?? null,
  }))

  return NextResponse.json(result)
}
