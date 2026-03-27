import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const diagnostic = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_START: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'none'
    },
    database: {
      connection: 'pending',
      error: null as any,
      productCount: 0
    }
  }

  try {
    const count = await db.product.count()
    diagnostic.database.connection = 'success'
    diagnostic.database.productCount = count
  } catch (error: any) {
    diagnostic.database.connection = 'failed'
    diagnostic.database.error = {
      message: error.message,
      code: error.code,
      meta: error.meta
    }
  }

  return NextResponse.json(diagnostic)
}
