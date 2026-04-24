import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function matchScore(productNames: string[], rfqItems: { productName: string }[]): number {
  let score = 0
  for (const rfqItem of rfqItems) {
    const keywords = rfqItem.productName.toLowerCase().split(/\s+/)
    for (const pName of productNames) {
      const pLower = pName.toLowerCase()
      for (const kw of keywords) {
        if (kw.length >= 3 && pLower.includes(kw)) {
          score++
          break
        }
      }
    }
  }
  return score
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    include: { rfqItems: true },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Order already blasted' }, { status: 400 })
  }

  const allSuppliers = await db.supplier.findMany({ include: { products: true } })

  const scored = allSuppliers
    .map((s) => ({
      supplier: s,
      score: matchScore(s.products.map((p) => p.name), order.rfqItems),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return NextResponse.json({ error: 'No matching suppliers found for this RFQ' }, { status: 404 })
  }

  const assignments = await Promise.all(
    scored.map(({ supplier }) =>
      db.rFQAssignment.upsert({
        where: { orderId_supplierId: { orderId: id, supplierId: supplier.id } },
        update: {},
        create: { orderId: id, supplierId: supplier.id, status: 'PENDING' },
        include: { supplier: true },
      })
    )
  )

  await db.order.update({ where: { id }, data: { status: 'SENT' } })

  return NextResponse.json({ assignments, count: assignments.length })
}
