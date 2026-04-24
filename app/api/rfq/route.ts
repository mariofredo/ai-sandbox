import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const orders = await db.order.findMany({
    include: {
      rfqItems: true,
      _count: { select: { assignments: true, responses: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const { title, description, items, adminId } = await req.json()

  if (!title || !description || !items || !Array.isArray(items)) {
    return NextResponse.json({ error: 'title, description, and items are required' }, { status: 400 })
  }

  const resolvedAdminId = adminId ?? 'admin_1'

  const order = await db.order.create({
    data: {
      title,
      description,
      status: 'DRAFT',
      adminId: resolvedAdminId,
      rfqItems: {
        create: items.map((item: { productName: string; quantity: number; unit: string; notes?: string }) => ({
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes ?? null,
        })),
      },
    },
    include: { rfqItems: true },
  })

  return NextResponse.json(order, { status: 201 })
}
