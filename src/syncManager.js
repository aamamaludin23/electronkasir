import { ambilBelumSync, tandaiSudahSync } from "./localDB.js";
import { kirimTransaksi } from "./firebaseSync.js";

function isOnline() {
  return navigator.onLine;
}

export async function sinkronkanTransaksi() {
  if (!isOnline()) {
    console.log("📴 Offline: sinkronisasi ditunda.");
    return;
  }

  const belumSync = ambilBelumSync();
  if (belumSync.length === 0) {
    console.log("✅ Tidak ada transaksi untuk disinkronkan.");
    return;
  }

  console.log(`☁️ Menyinkronkan ${belumSync.length} transaksi...`);

  for (const trx of belumSync) {
    const trxData = JSON.parse(trx.data);
    const success = await kirimTransaksi(trxData);
    if (success) tandaiSudahSync(trx.id);
  }

  console.log("🔥 Semua transaksi sudah tersinkron!");
}