const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'kasir_local.db');
const db = new Database(dbPath);

db.prepare(`
CREATE TABLE IF NOT EXISTS transaksi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tanggal TEXT,
  total REAL,
  data TEXT
)
`).run();

module.exports = db;
