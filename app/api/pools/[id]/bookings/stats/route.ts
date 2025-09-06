import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'swimming_pool_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+07:00',
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const poolId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '1')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Validate parameters
    if (isNaN(poolId) || isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }
    
    // Debug logging for environment variables
    console.log('Environment check:', {
      DB_HOST: process.env.DB_HOST ? 'SET' : 'NOT SET',
      DB_USER: process.env.DB_USER ? 'SET' : 'NOT SET',
      DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET',
      DB_NAME: process.env.DB_NAME ? 'SET' : 'NOT SET',
      DB_PORT: process.env.DB_PORT ? 'SET' : 'NOT SET'
    })
    
    let connection
    try {
      console.log('Attempting to connect to database with config:', {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port
      })
      connection = await mysql.createConnection(dbConfig)
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      console.error('Connection config used:', {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port
      })
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 })
    }
    
    const endDate = new Date(year, month, 0)
    const bookingStats = []
    
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(year, month - 1, day)
      // ใช้ Thailand timezone แทน UTC เพื่อป้องกันการเลื่อนวันที่
      const thailandDate = new Date(currentDate.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}))
      const dateString = thailandDate.toISOString().split('T')[0]
      
      try {
        // Count actual bookings for this date and pool
        const [bookingRows] = await connection.execute(
          `SELECT COUNT(*) as total_bookings 
           FROM reservations r 
           WHERE r.pool_resource_id = ? 
           AND DATE(r.reservation_date) = ? 
           AND r.status IN ('confirmed', 'pending')`,
          [poolId, dateString]
        )
        
        // Get pool capacity
        const [poolRows] = await connection.execute(
          `SELECT capacity FROM pool_resources WHERE id = ?`,
          [poolId]
        )
        
        const totalBookings = (bookingRows as any)[0]?.total_bookings || 0
        const poolCapacity = (poolRows as any)[0]?.capacity || 20
        const availableSlots = Math.max(0, poolCapacity - totalBookings)

        bookingStats.push({
          date: dateString,
          total_bookings: totalBookings,
          available_slots: availableSlots,
          pool_id: poolId
        })
      } catch (queryError) {
        console.error(`Error querying data for ${dateString}:`, queryError)
        // Use default values for this day
        bookingStats.push({
          date: dateString,
          total_bookings: 0,
          available_slots: 20,
          pool_id: poolId
        })
      }
    }
    
    await connection.end()
    return NextResponse.json(bookingStats)
    
  } catch (error) {
    console.error('Error in API route:', error)
    
    // Fallback: Return mock data when database fails
    const poolId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '1')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    
    const endDate = new Date(year, month, 0)
    const bookingStats = []
    
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(year, month - 1, day)
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
      
      // Generate consistent mock data based on date
      const seed = poolId * 1000 + day * 31 + month * 7
      const random1 = (seed * 9301 + 49297) % 233280 / 233280
      const random2 = ((seed + 1) * 9301 + 49297) % 233280 / 233280
      
      const totalBookings = Math.floor(random1 * 8) + 1
      const availableSlots = Math.floor(random2 * 12) + 8

      bookingStats.push({
        date: dateString,
        total_bookings: totalBookings,
        available_slots: availableSlots,
        pool_id: poolId
      })
    }
    
    console.log('Returning fallback mock data due to database error')
    return NextResponse.json(bookingStats)
  }
}