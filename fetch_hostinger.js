
const mysql = require('mysql2/promise');

async function fetchFromHostinger() {
  const mysqlConn = await mysql.createConnection("mysql://u239382299_admin_tienda:Jpm17pass71-@srv2197.hstgr.io:3306/u239382299_tienda_pujalte");
  try {
    const [products] = await mysqlConn.query("SELECT * FROM product WHERE name LIKE '%iman formas%'");
    console.log('Hostinger Results:', JSON.stringify(products, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mysqlConn.end();
  }
}

fetchFromHostinger();
