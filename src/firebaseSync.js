import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCsHzQ_Q6FHZctSo_L1cFlEZ5pMMyk9Hwg",
  authDomain: "kasirprov3.firebaseapp.com",
  projectId: "kasirprov3",
};

// 🔥 Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🟢 INILAH fungsi yang harus diekspor
export async function kirimTransaksi(transaksi) {
  try {
    const transaksiCol = collection(db, "transaksi");
    await addDoc(transaksiCol, transaksi);
    console.log("✅ Transaksi berhasil dikirim ke Firebase");
    return true;
  } catch (error) {
    console.error("❌ Gagal kirim transaksi ke Firebase:", error);
    return false;
  }
}