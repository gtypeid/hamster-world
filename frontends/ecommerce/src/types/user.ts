export interface User {
  publicId: string  // 클라이언트 노출용 ID (Snowflake String)
  username: string
  email: string
  name: string
  role: 'USER' | 'MERCHANT' | 'ADMIN'
  createdAt: string
}

export interface Order {
  id: string
  date: string
  status: string
  statusColor: string
  items: OrderItem[]
  total: number
}

export interface OrderItem {
  name: string
  quantity: number
  price: number
}
