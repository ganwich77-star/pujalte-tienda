
const mysql = require('mysql2/promise');

async function searchIMAN() {
  const mysqlConn = await mysql.createConnection("mysql://u239382299_admin_tienda:Jpm17pass71-@srv2197.hstgr.io:3306/u239382299_tienda_pujalte");
  try {
    const [products] = await mysqlConn.query("SELECT id, name FROM product WHERE name LIKE '%iman%' OR name LIKE '%formas%'");
    console.log('Hostinger Search Results:', JSON.stringify(products, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mysqlConn.end();
  }
}

searchIMAN();
