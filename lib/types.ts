// Chat types
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}

// Domain types mirroring Prisma models
export interface Admin {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface Supplier {
  id: string
  name: string
  email: string
  phone: string | null
  location: string
  rating: number
  categories: string[]
  products?: Product[]
  createdAt: Date
}

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  unit: string
  stock: number
  supplierId: string
}

export type OrderStatus = 'DRAFT' | 'SENT' | 'REVIEWING' | 'AWARDED' | 'CLOSED'

export interface RFQItem {
  id: string
  orderId: string
  productName: string
  quantity: number
  unit: string
  notes?: string | null
}

export interface Order {
  id: string
  title: string
  description: string
  status: OrderStatus
  adminId: string
  rfqItems: RFQItem[]
  aiSuggestion?: string | null
  awardedTo?: string[] | null
  createdAt: Date
  updatedAt: Date
  _count?: { assignments: number; responses: number }
}

export interface RFQAssignment {
  id: string
  orderId: string
  supplierId: string
  supplier?: Supplier
  status: 'PENDING' | 'RESPONDED'
  notifiedAt: Date
}

export interface RFQResponseItem {
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface RFQResponse {
  id: string
  orderId: string
  supplierId: string
  supplier?: Supplier
  canSupply: boolean
  notes?: string | null
  totalPrice?: number | null
  items?: RFQResponseItem[] | null
  isSelected: boolean
  createdAt: Date
}
