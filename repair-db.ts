import { mysqlDb } from './src/lib/db';

async function repair() {
  console.log("🛠️ Iniciando reparación de esquema...");
  try {
    await mysqlDb.query(`
      ALTER TABLE product 
      ADD COLUMN IF NOT EXISTS fotosIncluidas INT DEFAULT 1
    `).catch(e => {
        // Si ya existe, MySQL dará error 1060. Lo ignoramos.
        if (e.errno === 1060) {
            console.log("✅ La columna 'fotosIncluidas' ya existe en 'product'.");
        } else {
            throw e;
        }
    });

    await mysqlDb.query(`
      ALTER TABLE orderitem 
      ADD COLUMN IF NOT EXISTS fotosIncluidas INT DEFAULT 1
    `).catch(e => {
        if (e.errno === 1060) {
            console.log("✅ La columna 'fotosIncluidas' ya existe en 'orderitem'.");
        } else {
            throw e;
        }
    });

    console.log("🚀 Reparación completada.");
  } catch (err) {
    console.error("❌ Error en reparación:", err);
  }
}

repair();
