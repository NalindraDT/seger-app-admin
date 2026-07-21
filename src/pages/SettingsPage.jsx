import { useState, useEffect } from 'react';
import {
    Settings, Save, CheckCircle2, Target, Coins, ShieldAlert, Edit, X, AlertTriangle
} from 'lucide-react';
import { getBaseUrl } from '../utils/apiConfig';

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // State untuk menyimpan data yang ditampilkan di Card Limit
    const [settingsData, setSettingsData] = useState(null);

    // State BARU untuk Mode Maintenance
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
    
    // State BARU untuk Modal Konfirmasi Maintenance
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // State untuk Modal Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        max_point_earning_activities_per_day: '',
        max_points_per_day: ''
    });

    // FUNGSI READ (GET) - Fetch Limit Activity & Maintenance Status
    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            
            // Fetch Limit Poin
            const limitResponse = await fetch(`${getBaseUrl()}/admin/settings/activity-claim-limit`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const limitJson = await limitResponse.json();

            if (limitJson.status === 'success') {
                setSettingsData(limitJson.data);
            }

            // Fetch Status Maintenance
            const maintenanceResponse = await fetch(`${getBaseUrl()}/admin/settings/maintenance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const maintenanceJson = await maintenanceResponse.json();

            if (maintenanceJson.status === 'success') {
                setIsMaintenance(maintenanceJson.data.is_maintenance);
            }

        } catch (error) {
            console.error("Gagal mengambil data pengaturan", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // BUKA MODAL DAN ISI FORM DENGAN DATA SAAT INI
    const openEditModal = () => {
        setFormData({
            max_point_earning_activities_per_day: settingsData?.max_point_earning_activities_per_day || '',
            max_points_per_day: settingsData?.max_points_per_day || ''
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
    };

    // FUNGSI UPDATE LIMIT (PUT)
    const handleSubmitLimit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('jwt_token');
            const payload = {
                max_point_earning_activities_per_day: Number(formData.max_point_earning_activities_per_day),
                max_points_per_day: Number(formData.max_points_per_day)
            };

            const response = await fetch(`${getBaseUrl()}/admin/settings/activity-claim-limit`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const json = await response.json();

            if (json.status === 'success' || json.success) {
                showToast('Pengaturan limit berhasil diperbarui!');
                closeEditModal();
                fetchSettings(); // Refresh card data
            } else {
                alert(json.message || "Terjadi kesalahan saat menyimpan pengaturan.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // FUNGSI MEMUNCULKAN MODAL KONFIRMASI (Tanpa langsung ubah API)
    const handleToggleClick = () => {
        setIsConfirmModalOpen(true);
    };

    // FUNGSI EKSEKUSI API MAINTENANCE SETELAH DIKONFIRMASI
    const executeToggleMaintenance = async () => {
        const targetState = !isMaintenance;
        setIsTogglingMaintenance(true);

        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/settings/maintenance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_maintenance: targetState })
            });

            const json = await response.json();

            if (json.status === 'success' || json.success) {
                setIsMaintenance(targetState); // Update UI setelah sukses API
                showToast(targetState ? 'Mode Perbaikan Aktif!' : 'Mode Perbaikan Dimatikan!');
            } else {
                alert(json.message || "Gagal mengubah status maintenance.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan saat mengubah status maintenance.");
        } finally {
            setIsTogglingMaintenance(false);
            setIsConfirmModalOpen(false); // Tutup modal setelah proses selesai
        }
    };

    return (
        <div className="space-y-6 relative">

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-white border border-green-100 shadow-xl rounded-xl p-4 flex items-center space-x-3 pr-6">
                        <div className="bg-green-100 p-1.5 rounded-full">
                            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                        </div>
                        <div>
                            <p className="text-sm font-extrabold text-gray-900">Berhasil!</p>
                            <p className="text-xs font-medium text-gray-500">{toastMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER TITLE */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Pengaturan Aplikasi</h1>
                <p className="text-sm text-gray-500 mt-1">Konfigurasi parameter dan batasan utama sistem</p>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#5A2EFF] border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-bold text-gray-500">Memuat pengaturan...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">

                    {/* ========================================= */}
                    {/* WIDGET CARD 1: LIMIT POIN HARIAN            */}
                    {/* ========================================= */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-5 flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#5A2EFF]">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Limit Harian</h3>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Keamanan Poin</p>
                                </div>
                            </div>
                            <button
                                onClick={openEditModal}
                                className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors"
                                title="Edit Limit"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 pb-5 flex-1 flex flex-col justify-end">
                            <div className="bg-[#F8F9FC] rounded-xl p-4 grid grid-cols-2 gap-3 border border-gray-100">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold mb-1">MAKS. AKTIVITAS</p>
                                    <div className="flex items-baseline space-x-1">
                                        <span className="text-xl font-black text-gray-900">{settingsData?.max_point_earning_activities_per_day}</span>
                                        <span className="text-xs text-gray-500 font-medium">kali/hari</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold mb-1">MAKS. POIN</p>
                                    <div className="flex items-baseline space-x-1">
                                        <span className="text-xl font-black text-gray-900">{settingsData?.max_points_per_day}</span>
                                        <span className="text-xs text-gray-500 font-medium">poin/hari</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========================================= */}
                    {/* WIDGET CARD 2: MAINTENANCE MODE             */}
                    {/* ========================================= */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
                        {/* Efek Garis Merah jika Aktif */}
                        {isMaintenance && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>}
                        
                        <div className="p-5 flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isMaintenance ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                                    <Settings className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Mode Perbaikan</h3>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Kill Switch</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 pb-5 flex-1 flex flex-col justify-end">
                            <div className={`rounded-xl p-4 border flex items-center justify-between transition-colors ${isMaintenance ? 'bg-red-50 border-red-100' : 'bg-[#F8F9FC] border-gray-100'}`}>
                                <div>
                                    <p className={`text-xs font-bold mb-1 ${isMaintenance ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isMaintenance ? 'SEDANG AKTIF' : 'NONAKTIF'}
                                    </p>
                                    <p className={`text-[10px] max-w-[150px] ${isMaintenance ? 'text-red-500' : 'text-gray-500'}`}>
                                        {isMaintenance ? 'Semua API terkunci. User tidak bisa akses aplikasi.' : 'Aplikasi berjalan normal.'}
                                    </p>
                                </div>
                                
                                {/* TOGGLE SWITCH STYLE IOS (Hanya memunculkan modal) */}
                                <button
                                    onClick={handleToggleClick}
                                    disabled={isTogglingMaintenance}
                                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5A2EFF] focus-visible:ring-offset-2 ${isMaintenance ? 'bg-red-500' : 'bg-gray-300'} ${isTogglingMaintenance ? 'opacity-50 cursor-wait' : ''}`}
                                    role="switch"
                                    aria-checked={isMaintenance}
                                >
                                    <span className="sr-only">Toggle Maintenance Mode</span>
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMaintenance ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* ========================================= */}
            {/* MODAL JENDELA TERBANG (EDIT LIMIT)          */}
            {/* ========================================= */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] flex flex-col overflow-hidden">

                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#F8F9FC]">
                            <div className="flex items-center space-x-2">
                                <ShieldAlert className="w-5 h-5 text-[#5A2EFF]" />
                                <h2 className="text-base font-bold text-gray-900">Edit Limit Harian</h2>
                            </div>
                            <button onClick={closeEditModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitLimit}>
                            <div className="p-6 space-y-5">
                                {/* Maksimal Aktivitas */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-800 mb-1">Batas Jumlah Aktivitas</label>
                                    <p className="text-[10px] text-gray-500 mb-2">Maksimal user bisa claim poin dalam 1 hari.</p>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Target className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="number" min="0" required
                                            value={formData.max_point_earning_activities_per_day}
                                            onChange={(e) => setFormData({ ...formData, max_point_earning_activities_per_day: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Maksimal Poin */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-800 mb-1">Batas Total Poin</label>
                                    <p className="text-[10px] text-gray-500 mb-2">Batas absolut poin yang dikumpulkan per hari.</p>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Coins className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="number" min="0" required
                                            value={formData.max_points_per_day}
                                            onChange={(e) => setFormData({ ...formData, max_points_per_day: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER MODAL */}
                            <div className="px-6 py-5 border-t border-gray-100 bg-white flex space-x-3">
                                <button type="button" onClick={closeEditModal} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-[#10B981] text-white font-bold hover:bg-green-600 shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center">
                                    {isSubmitting ? 'Menyimpan...' : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" /> Simpan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL KONFIRMASI MAINTENANCE                */}
            {/* ========================================= */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center border border-gray-100">
                        
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${!isMaintenance ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                            {!isMaintenance ? 'Aktifkan Mode Perbaikan?' : 'Matikan Mode Perbaikan?'}
                        </h3>
                        
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            {!isMaintenance 
                                ? 'Semua user (pengguna mobile) akan langsung dikeluarkan dan tidak bisa mengakses aplikasi hingga mode ini dimatikan kembali.' 
                                : 'Aplikasi akan kembali berjalan normal dan user dapat melakukan aktivitas seperti biasa.'}
                        </p>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                disabled={isTogglingMaintenance}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeToggleMaintenance}
                                disabled={isTogglingMaintenance}
                                className={`flex-1 px-4 py-3 rounded-xl text-white font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center ${!isMaintenance ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {isTogglingMaintenance ? 'Memproses...' : 'Ya, Lanjutkan'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}