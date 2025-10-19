import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "kasir_local.db");
const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS transaksi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT,
    total REAL,
    data TEXT,
    synced INTEGER DEFAULT 0
  )
`).run();

export function simpanTransaksiLokal(transaksi) {
  const data = JSON.stringify(transaksi);
  db.prepare("INSERT INTO transaksi (tanggal, total, data) VALUES (?, ?, ?)").run(
    new Date().toISOString(),
    transaksi.total || 0,
    data
  );
}

export function ambilBelumSync() {
  return db.prepare("SELECT * FROM transaksi WHERE synced = 0").all();
}

export function tandaiSudahSync(id) {
  db.prepare("UPDATE transaksi SET synced = 1 WHERE id = ?").run(id);
}