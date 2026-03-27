export interface ProductVariant {
  id: string
  name: string
  sku: string | null
  price: number
  stock: number
  active: boolean
  sortOrder: number
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  stock: number
  categoryId: string | null
  category: { id: string; name: string } | null
  active: boolean
  showPrice: boolean
  isPack: boolean
  packItems: string | null
  hasVariants: boolean
  variantType: string | null
  variantBehavior?: 'add' | 'replace'
  variants: ProductVariant[]
  isNew?: boolean
  salePrice?: number | null
  minQuantity?: number
  stepQuantity?: number
  tierPricing?: { minQty: number; price: number }[] | string | null
}

export interface Category {
  id: string
  name: string
  description: string | null
  image?: string | null
  _count?: { products: number }
}

export interface OrderItem {
  id: string
  productName: string
  variantName: string | null
  quantity: number
  price: number
  note?: string | null
}

export interface Order {
  id: string
  trackingNumber?: string | null
  customerName: string
  customerPhone: string
  customerEmail: string | null
  address: string | null
  notes: string | null
  total: number
  status: string
  paymentMethod: string | null
  paymentStatus: string
  items: OrderItem[]
  createdAt: string
  customFields?: Record<string, string>
}

export interface FormField {
  id: string
  label: string
  placeholder: string
  type: 'text' | 'tel' | 'email' | 'textarea'
  required: boolean
  active: boolean
  isCustom?: boolean
}

export interface StoreConfig {
  [key: string]: any;
  whatsappNumber: string
  storeName: string
  showImages: boolean
  currency: string
  phone: string
  email: string
  slogan: string
  enableCash: boolean
  enableBizum: boolean
  enableCard: boolean
  adminPassword?: string
  formFields: FormField[]
  promos?: any[] // Para evitar dependencias circulares con lib/landing-config
}

