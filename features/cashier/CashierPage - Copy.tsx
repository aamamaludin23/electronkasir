

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Item, CartItem, PriceTier } from '../../types';
import { useData } from '../../context/DataContext';
import { useSession } from '../../context/SessionContext';
import { Modal } from '../../components/Modal';
import { PaymentModal } from './PaymentModal';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { EmptyState } from '../../components/EmptyState';
import { ICONS } from '../../constants';

const CashierPage: React.FC = () => {
    const { items, customers, banks } = useData();
    const {
        cart, setCart,
        discount, setDiscount,
        otherFees, setOtherFees,
        selectedCustomerId, setSelectedCustomerId,
        handleTransactionCompleteWrapper,
        handleHoldTransaction,
        pendingTransaction,
        clearPendingTransaction,
        total,
        subtotal,
        tax,
        settings,
    } = useSession();

    const [showPriceModal, setShowPriceModal] = useState(false);
    const [selectedItemForPrice, setSelectedItemForPrice] = useState<Item | null>(null);
    const [itemToEditUnit, setItemToEditUnit] = useState<{ item: CartItem, index: number } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [focusedSearchIndex, setFocusedSearchIndex] = useState(-1);
    const [focusedPriceIndex, setFocusedPriceIndex] = useState(0);
    const [focusedCartIndex, setFocusedCartIndex] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);
    const [itemToFocusQty, setItemToFocusQty] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ itemId: string; priceTierName: string; } | null>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const cartItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const qtyInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    
    const availableItems = useMemo(() => items.filter(item => item.statusJual !== 'Tidak Dijual'), [items]);

    const Fuse = (window as any).Fuse;

    const fuse = useMemo(() => {
        if (!Fuse) return null;
        return new Fuse(availableItems, {
            keys: ['name', 'itemCode'],
            includeScore: true,
            threshold: 0.3,
        });
    }, [availableItems, Fuse]);

    // High-performance barcode lookup map
    const barcodeMap = useMemo(() => {
        const map = new Map<string, { item: Item, priceTier: PriceTier }>();
        availableItems.forEach(item => {
            item.prices.forEach(priceTier => {
                if (priceTier.barcode) {
                    map.set(priceTier.barcode, { item, priceTier });
                }
            });
        });
        return map;
    }, [availableItems]);

    useEffect(() => {
        if (pendingTransaction) {
            const cartItems = pendingTransaction.items.map(tItem => {
                const fullItem = items.find(i => i.id === tItem.id);
                if (!fullItem) return null;
                return {
                    ...fullItem,
                    quantity: tItem.quantity,
                    priceTier: tItem.priceTier,
                };
            }).filter((item): item is CartItem => item !== null);

            setCart(cartItems);
            setDiscount(pendingTransaction.discount || 0);
            setOtherFees(pendingTransaction.otherFees || 0);
            setSelectedCustomerId(pendingTransaction.customerId || '1');
            clearPendingTransaction();
        }
    }, [pendingTransaction, items, setCart, setDiscount, setOtherFees, setSelectedCustomerId, clearPendingTransaction]);

    const filteredItems = useMemo(() => {
  if (!searchTerm.trim() || !fuse) return [];
  const results = fuse.search(searchTerm);
  return results.map(r => r.item);
}, [searchTerm, fuse]);

    useEffect(() => { if (isSearching && searchInputRef.current) searchInputRef.current.focus(); }, [isSearching]);

    const resetSearch = useCallback(() => {
        setSearchTerm(''); setFocusedSearchIndex(-1); setIsSearching(false);
        setSelectedItemForPrice(null); setShowPriceModal(false); setItemToEditUnit(null);
    }, []);

    const addToCart = useCallback((item: Item, priceTier: PriceTier) => {
        const itemKey = `${item.id}-${priceTier.name}`;
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(ci => ci.id === item.id && ci.priceTier.name === priceTier.name);
            if (existingItemIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex] = { ...newCart[existingItemIndex], quantity: newCart[existingItemIndex].quantity + 1 };
                return newCart;
            }
            return [...prevCart, { ...item, quantity: 1, priceTier }];
        });
        setItemToFocusQty(itemKey);
        resetSearch();
    }, [setCart, resetSearch]);

    const handleItemClick = useCallback((item: Item) => {
  if (!item) return;

  if (item.prices?.length > 1) {
    setSelectedItemForPrice(item);
    setFocusedPriceIndex(0);
    setShowPriceModal(true);
  } else if (item.prices?.length === 1) {
    addToCart(item, item.prices[0]);
  }

  // 🔧 Tambahan agar produk lain bisa diinput setelah 1 barang
  setTimeout(() => {
    setSearchTerm('');
    setIsSearching(false);
    if (fuse && items?.length > 0) fuse.setCollection(items); // refresh daftar produk
  }, 300);
}, [addToCart, fuse, items]);
    
    // Barcode scanner listener
    useEffect(() => {
        let barcode = '';
        let lastKeyTime = Date.now();

        const handleBarcodeScan = (e: KeyboardEvent) => {
            // Ignore if a modal is open or an input is focused, to prevent interference.
            // Also resets the barcode buffer to avoid capturing partial input.
            if (showPaymentModal || showPriceModal || itemToEditUnit || showDeleteConfirm || (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
                barcode = '';
                return;
            }
            
            const currentTime = Date.now();
            // A short time diff between keys suggests scanner input vs. manual typing.
            const timeDiff = currentTime - lastKeyTime;
            lastKeyTime = currentTime;

            if (timeDiff > 100) { // If there's a pause, reset the barcode buffer.
                barcode = '';
            }

            if (e.key === 'Enter') {
                if (barcode.length > 3) { // Typical barcodes are longer than 3 chars.
                    const found = barcodeMap.get(barcode);
                    if (found) {
                        addToCart(found.item, found.priceTier);
                    }
                }
                barcode = ''; // Reset after processing.
            } else if (e.key.length === 1) { // Append alphanumeric characters from the scanner.
                barcode += e.key;
            }
        };

        window.addEventListener('keydown', handleBarcodeScan);
        return () => {
            window.removeEventListener('keydown', handleBarcodeScan);
        };
    }, [showPaymentModal, showPriceModal, itemToEditUnit, showDeleteConfirm, barcodeMap, addToCart]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showPaymentModal || showPriceModal || itemToEditUnit || showDeleteConfirm) return;
            if (e.key === 'F10' && cart.length > 0) { e.preventDefault(); setShowPaymentModal(true); }
            if (isSearching) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedSearchIndex(prev => Math.min(prev + 1, filteredItems.length - 1)); } 
                else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedSearchIndex(prev => Math.max(prev - 1, 0)); } 
                else if (e.key === 'Enter') { e.preventDefault(); if (focusedSearchIndex >= 0) handleItemClick(filteredItems[focusedSearchIndex]); } 
                else if (e.key === 'Escape') { resetSearch(); }
                return;
            }
            if (!isSearching && cart.length > 0) {
                if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedCartIndex(prev => Math.max(0, prev - 1)); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedCartIndex(prev => Math.min(cart.length - 1, prev + 1)); }
            }
            // Allow typing to start search
            if (!isSearching && /^[a-zA-Z0-9]$/.test(e.key) && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
                e.preventDefault();
                setIsSearching(true);
				setTimeout(() => {
                setSearchTerm(e.key);
				if (searchInputRef.current) searchInputRef.current.focus();
				}, 50);
            }
            if (!isSearching && e.key === 'Enter') { e.preventDefault(); setIsSearching(true); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearching, showPriceModal, itemToEditUnit, focusedSearchIndex, filteredItems, showPaymentModal, cart, focusedCartIndex, handleItemClick, resetSearch, showDeleteConfirm]);
    
    useEffect(() => {
        if (showPriceModal) {
            const handleModalKeyDown = (e: KeyboardEvent) => {
                const prices = selectedItemForPrice?.prices;
                if (!prices) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedPriceIndex(prev => (prev + 1) % prices.length); } 
                else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedPriceIndex(prev => (prev - 1 + prices.length) % prices.length); } 
                else if (e.key === 'Enter') { e.preventDefault(); if (focusedPriceIndex >= 0 && selectedItemForPrice) addToCart(selectedItemForPrice, prices[focusedPriceIndex]); }
                else if (e.key === 'Escape') { e.preventDefault(); resetSearch(); }
            };
            window.addEventListener('keydown', handleModalKeyDown);
            return () => window.removeEventListener('keydown', handleModalKeyDown);
        }
    }, [showPriceModal, selectedItemForPrice, focusedPriceIndex, addToCart, resetSearch]);

    useEffect(() => {
        if (itemToFocusQty) {
            const input = qtyInputRefs.current[itemToFocusQty];
            if (input) { input.focus(); input.select(); }
            setItemToFocusQty(null);
        }
    }, [itemToFocusQty]);

    const handleChangeUnit = useCallback((item: CartItem, newPriceTier: PriceTier) => {
        const itemKey = `${item.id}-${newPriceTier.name}`;
        setCart(prevCart => prevCart.map(ci => (ci.id === item.id && ci.priceTier.name === item.priceTier.name) ? { ...ci, priceTier: newPriceTier } : ci));
        setItemToFocusQty(itemKey);
        resetSearch();
    }, [setCart, resetSearch]);

    const updateQuantity = useCallback((itemId: string, priceTierName: string, delta: number) => {
        setCart(prevCart => {
            const item = prevCart.find(i => i.id === itemId && i.priceTier.name === priceTierName);
            if (!item) return prevCart;
    
            const newQuantity = item.quantity + delta;
            
            if (newQuantity <= 0) {
                setItemToDelete({ itemId, priceTierName });
                setShowDeleteConfirm(true);
                return prevCart; 
            }
            
            return prevCart.map(i => 
                i.id === itemId && i.priceTier.name === priceTierName 
                ? { ...i, quantity: newQuantity } 
                : i
            );
        });
    }, [setCart]);

    const confirmDeleteItem = useCallback(() => {
        if (!itemToDelete) return;
        setCart(prevCart => prevCart.filter(i => !(i.id === itemToDelete.itemId && i.priceTier.name === itemToDelete.priceTierName)));
        setItemToDelete(null);
    }, [itemToDelete, setCart]);

    const getPriceForCartItem = (cartItem: CartItem) => {
        const { priceTier, quantity } = cartItem;
        const sortedLevels = [...(priceTier.wholesaleLevels || [])].sort((a,b) => b.minQty - a.minQty);
        for(const level of sortedLevels) if(quantity >= level.minQty) return level.price;
        return priceTier.price;
    }

    const handleConfirmPayment = useCallback((paymentDetails: any) => {
        handleTransactionCompleteWrapper(paymentDetails);
        setShowPaymentModal(false);
    }, [handleTransactionCompleteWrapper]);

    return (
  <div className="min-h-[calc(100vh-120px)] bg-gray-50 text-gray-900 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-5 gap-4">
    {/* 🛒 KERANJANG */}
    <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Keranjang</h2>
          <div title="Siap scan" className="flex items-center gap-1 text-green-500">
            {ICONS.barcode}
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          </div>
        </div>
        <div className="w-full md:w-1/3 mt-2 md:mt-0">
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
          >
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* List Keranjang */}
      <div className="flex-grow overflow-y-auto border border-gray-100 rounded-lg p-3">
        {cart.length === 0 ? (
          <EmptyState
            title="Keranjang Kosong"
            message="Cari atau scan barang untuk memulai transaksi."
          />
        ) : (
          <div className="space-y-2">
            {cart.map((item, index) => {
              const currentPrice = getPriceForCartItem(item);
              const itemKey = `${item.id}-${item.priceTier.name}`;
              return (
                <div
                  key={itemKey}
                  className="bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-between items-center p-3"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.priceTier.name} @ Rp {currentPrice.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.priceTier.name, -1)}
                      className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value, 10);
                        if (!isNaN(newQty)) {
                          const delta = newQty - item.quantity;
                          updateQuantity(item.id, item.priceTier.name, delta);
                        }
                      }}
                      className="w-14 text-center border border-gray-200 rounded-md text-sm"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.priceTier.name, 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right w-24 font-semibold text-gray-800">
                    Rp {(currentPrice * item.quantity).toLocaleString("id-ID")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tombol Tambah Barang */}
      {/* Tombol Tambah Barang */}
<div className="mt-4 relative">
  {!isSearching ? (
    <button
      onClick={() => setIsSearching(true)}
      className="w-full border-2 border-dashed border-indigo-500 text-indigo-600 py-3 rounded-lg font-semibold hover:bg-indigo-50"
    >
      + Tambah Barang (Ketik untuk mencari...)
    </button>
  ) : (
    <div className="relative">
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Ketik nama atau kode barang..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setFocusedSearchIndex(0);
        }}
        onKeyDown={(e) => {
          if (filteredItems.length > 0) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setFocusedSearchIndex((prev) => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setFocusedSearchIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const selectedItem = filteredItems[focusedSearchIndex];
              if (selectedItem) handleItemClick(selectedItem);
            } else if (e.key === 'Escape') {
              setSearchTerm('');
              setIsSearching(false);
            }
          }
        }}
        className="w-full p-3 border-2 border-indigo-500 rounded-lg focus:outline-none"
      />

      {/* 🔼 Dropdown hasil pencarian di ATAS input */}
      {searchTerm && (
        <div className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-gray-200 shadow-lg rounded-lg max-h-60 overflow-y-auto z-20">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3 cursor-pointer hover:bg-gray-100 ${
                  index === focusedSearchIndex ? 'bg-indigo-50' : ''
                }`}
              >
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">{item.itemCode}</p>
              </div>
            ))
          ) : (
            <div className="p-3 text-gray-500">Barang tidak ditemukan.</div>
          )}
        </div>
      )}
    </div>
  )}
</div>
    </div>

    {/* 💰 PANEL TOTAL */}
    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div>
        <div className="text-right mb-6">
          <p className="text-sm font-bold text-gray-500 tracking-widest">TOTAL</p>
          <p className="text-5xl font-extrabold text-gray-900">
            Rp {total.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Potongan (Rp)</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-32 border border-gray-300 rounded-md p-2 text-right"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Biaya Lain (Rp)</span>
            <input
              type="number"
              value={otherFees}
              onChange={(e) => setOtherFees(Number(e.target.value))}
              className="w-32 border border-gray-300 rounded-md p-2 text-right"
            />
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4 text-right space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>PPN ({settings.taxRate || 11}%)</span>
              <span>Rp {tax.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-indigo-700 mt-2">
              <span>Total</span>
              <span>Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={handleHoldTransaction}
          disabled={cart.length === 0}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          Tahan
        </button>
        <button
          onClick={() => setShowPaymentModal(true)}
          disabled={cart.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          Bayar (F10)
        </button>
      </div>
    </div>
  </div>
 );
};

export default CashierPage;