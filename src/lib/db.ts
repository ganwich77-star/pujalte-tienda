import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";

// 1. Prisma Client para Configuración Global (Neon/Postgres)
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;


// 2. MySQL Pool para Catálogo Premium (Escalabilidad de Productos)
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pujalte_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const mysqlDb = {
  // Ejecutar consultas parametrizadas de forma segura
  query: async (sql: string, params?: any[]) => {
    try {
      const [rows, fields] = await mysqlPool.execute(sql, params);
      return [rows, fields];
    } catch (error: any) {
      console.error("MySQL Query Error:", error.message);
      throw error;
    }
  },
  getConnection: () => mysqlPool.getConnection(),
};