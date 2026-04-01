import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";

// 1. Prisma Client para Configuración Global (Neon/Postgres)
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "mysql://u239382299_admin_tienda:Jpm17pass71-@srv2197.hstgr.io:3306/u239382299_tienda_pujalte"
      }
    }
  });
};

// En desarrollo, necesitamos forzar una re-inicialización para captar cambios de esquema
export const db = (process.env.NODE_ENV === "production") 
  ? (globalThis.prisma || prismaClientSingleton())
  : prismaClientSingleton();

console.log("--- DB INSTANCE RELOADED ---", Object.keys(db).includes('supplier') ? 'SUPPLIER OK' : 'NO SUPPLIER');

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;


// 2. MySQL Pool para Catálogo Premium (Escalabilidad de Productos)
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || "srv2197.hstgr.io",
  user: process.env.DB_USER || "u239382299_admin_tienda",
  password: process.env.DB_PASSWORD || "Jpm17pass71-",
  database: process.env.DB_NAME || "u239382299_tienda_pujalte",
  port: 3306,
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