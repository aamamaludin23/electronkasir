const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  simpanTransaksi: (data) => ipcRenderer.invoke("simpan-transaksi", data),
  ambilTransaksi: () => ipcRenderer.invoke("ambil-transaksi"),
});