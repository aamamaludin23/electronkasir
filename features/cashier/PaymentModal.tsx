import React, { useState, useEffect, useRef } from 'react';
import type { Customer, Bank } from '../../types';
import { Modal } from '../../components/Modal';

interface PaymentModalProps {
    show: boolean;
    onClose: () => void;
    total: number;
    onConfirm: (paymentDetails: any) => void;
    selectedCustomerId: string;
    customers: Customer[];
    banks: Bank[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ show, onClose, total, onConfirm, selectedCustomerId, customers, banks }) => {
    const [method, setMethod] = useState<'Tunai' | 'Debit' | 'E-Money' | 'Kredit'>('Tunai');
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [selectedBank, setSelectedBank] = useState('');
    const cashInputRef = useRef<HTMLInputElement>(null);

    // Fokus otomatis ke input tunai
    useEffect(() => {
        if (show && method === 'Tunai' && cashInputRef.current) {
            cashInputRef.current.focus();
            cashInputRef.current.select();
        }
    }, [show, method]);

    // ✅ Perhitungan kembalian aman (selalu angka)
    const change = method === 'Tunai' && amountPaid >= total ? amountPaid - total : 0;

    // ✅ Validasi dan konfirmasi pembayaran
    const handleConfirm = () => {
        const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

        if (method === 'Kredit' && (!selectedCustomer || selectedCustomer.name === 'UMUM')) {
            alert("Pelanggan 'UMUM' tidak bisa berhutang. Silakan pilih pelanggan lain untuk metode kredit.");
            return;
        }

        if (method === 'Debit' && !selectedBank) {
            alert("Silakan pilih bank untuk pembayaran Debit.");
            return;
        }

        if (method === 'Tunai' && amountPaid < total) {
            alert("Jumlah bayar kurang dari total belanja.");
            return;
        }

        onConfirm({
            total,
            method,
            amountPaid: method === 'Kredit' ? 0 : (method === 'Tunai' ? amountPaid : total),
            change,
            customerId: selectedCustomerId || null,
            bank: method === 'Debit' ? selectedBank : null,
        });

        // Reset setelah pembayaran
        setAmountPaid(0);
        setSelectedBank('');
    };

    // Tombol Konfirmasi disable condition
    const isConfirmDisabled = () => {
        if (method === 'Kredit') {
            const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
            return !selectedCustomer || selectedCustomer.name === 'UMUM';
        }
        if (method === 'Tunai') return amountPaid < total;
        if (method === 'Debit') return !selectedBank;
        return false;
    };

    // Enter untuk konfirmasi
    const handleCashKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isConfirmDisabled()) {
            handleConfirm();
        }
    };

    return (
        <Modal show={show} onClose={onClose} title="Metode Pembayaran">
            {/* Tab metode */}
            <div className="flex justify-center border-b border-default mb-4">
                {['Tunai', 'Debit', 'E-Money', 'Kredit'].map(m => (
                    <button
                        key={m}
                        onClick={() => setMethod(m as any)}
                        className={`py-3 px-6 text-md font-medium transition-colors ${
                            method === m ? 'border-b-2 border-accent accent-color' : 'text-secondary hover:text-primary'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Total */}
            <div className="text-center my-6">
                <p className="text-secondary text-lg">Total Belanja</p>
                <p className="text-5xl font-bold accent-color">Rp {total.toLocaleString('id-ID')}</p>
            </div>

            {/* Input Tunai */}
            {method === 'Tunai' && (
                <div className="my-4">
                    <label className="block text-primary text-sm font-bold mb-2">Jumlah Bayar (Rp)</label>
                    <input
                        ref={cashInputRef}
                        type="number"
                        value={amountPaid === 0 ? '' : amountPaid}
                        onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                        className="w-full p-4 text-2xl border-2 border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                        onKeyDown={handleCashKeyDown}
                    />

                    {/* Tombol cepat */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        {[20000, 50000, 100000, total].map(val => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setAmountPaid(val)}
                                className="bg-tertiary text-primary py-3 rounded-lg hover:bg-gray-200 font-semibold transition"
                            >
                                Rp {val.toLocaleString('id-ID')}
                            </button>
                        ))}
                    </div>

                    {/* Kembalian */}
                    <div className="flex justify-between mt-4 text-2xl font-medium text-primary">
                        <span>Kembalian:</span>
                        <span className="font-bold">Rp {change.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            )}

            {/* Input Debit */}
            {method === 'Debit' && (
                <div className="my-4">
                    <label className="block text-primary text-sm font-bold mb-2">Pilih Bank</label>
                    <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full text-lg border border-gray-300 rounded-md p-3"
                        required
                    >
                        <option value="">-- Pilih Bank --</option>
                        {banks.map(bank => (
                            <option key={bank.id} value={bank.name}>
                                {bank.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Info Kredit */}
            {method === 'Kredit' && (
                <div className="my-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg text-center">
                    Transaksi akan ditambahkan ke tagihan pelanggan yang dipilih.
                </div>
            )}

            {/* Tombol konfirmasi */}
            <div className="mt-6">
                <button
                    onClick={handleConfirm}
                    disabled={isConfirmDisabled()}
                    className="w-full accent-bg accent-text font-bold py-4 text-xl rounded-lg accent-bg-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Konfirmasi Pembayaran
                </button>
            </div>
        </Modal>
    );
};