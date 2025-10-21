import React from 'react';
import { useSession } from '../context/SessionContext';
import { ICONS } from '../constants';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { page, setPage, user } = useSession();

  const menuItems = [
    { name: 'Kasir', icon: ICONS.cashier },
    { name: 'Penjualan', icon: ICONS.sales },
    { name: 'Absensi', icon: ICONS.clock },
    { name: 'Dasbor', icon: ICONS.dashboard },
    { name: 'Laporan', icon: ICONS.report },
    { name: 'Master Data', icon: ICONS.inventory },
    { name: 'Pengaturan', icon: ICONS.settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* 🔹 Header */}
      <header className="flex justify-between items-center bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-600">KasirPro (Simulasi)</span>
          <span className="text-sm text-gray-500">Kasir: {user?.name || 'asda'}</span>
        </div>

        <button
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
          onClick={() => setPage('Login')}
        >
          Akhiri Sesi
        </button>
      </header>

      {/* 🔹 Horizontal Menu */}
      <nav className="flex items-center gap-2 px-6 py-2 bg-gray-100 border-b border-gray-200 overflow-x-auto">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setPage(item.name)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm whitespace-nowrap transition ${
              page === item.name
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      {/* 🔹 Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default MainLayout;
