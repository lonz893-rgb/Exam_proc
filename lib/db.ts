import mysql from "mysql2/promise"

let pool: mysql.Pool | null = null

function createPool() {
  if (!pool) {
    console.log("Creating MySQL connection pool...")
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "cec_exam_system",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
    })
    console.log("MySQL pool created successfully")
  }
  return pool
}

export async function executeQuery(query: string, params: any[] = []): Promise<any> {
  const connection = createPool()

  try {
    console.log("Executing query:", query)
    console.log("With params:", params)
    const [results] = await connection.execute(query, params)
    console.log("Query executed successfully, results:", results)
    return results
  } catch (error) {
    console.error("Database query error:", error)
    console.error("Query was:", query)
    console.error("Params were:", params)
    throw error
  }
}

export async function testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const connection = createPool()
    await connection.execute("SELECT 1 as test")
    console.log("Database connection test successful")
    return {
      success: true,
      message: "Database connection successful",
    }
  } catch (error) {
    console.error("Database connection test failed:", error)
    return {
      success: false,
      message: "Database connection failed",
      error: error.message,
    }
  }
}
