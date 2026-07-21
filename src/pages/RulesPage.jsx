import { useState, useEffect } from 'react';
import {
    Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight,
    X, MapPin, ChevronDown, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { getBaseUrl } from '../utils/apiConfig';

export default function RulesPage() {
    const [activeTab, setActiveTab] = useState('exp'); // 'exp' atau 'point'
    const [rules, setRules] = useState([]);
    const [activityTypes, setActivityTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // STATE UNTUK MODAL TAMBAH/EDIT
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedRuleId, setSelectedRuleId] = useState(null);
    const [selectedActivityName, setSelectedActivityName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // STATE UNTUK MODAL HAPUS
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState(null);

    const [formData, setFormData] = useState({
        activity_type_id: '',
        min_distance_km: '',
        reward_amount: '',
        is_active: true
    });

    const fetchActivityTypes = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/activity-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) setActivityTypes(json.data);
        } catch (error) {
            console.error("Gagal mengambil data tipe aktifitas", error);
        }
    };

    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const endpoint = activeTab === 'exp' ? 'xp-rules' : 'point-rules';

            const response = await fetch(`${getBaseUrl()}/admin/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                setRules(json.data);
            } else {
                setRules([]);
            }
        } catch (error) {
            console.error(`Gagal mengambil data ${activeTab} rules`, error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivityTypes();
    }, []);

    useEffect(() => {
        fetchRules();
    }, [activeTab]);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const getActivityName = (id) => {
        const activity = activityTypes.find(act => act.id === id);
        return activity ? activity.name : `ID: ${id}`;
    };

    // LOGIKA BARU: Menyaring aktifitas yang BELUM punya rule di tab ini
    const availableActivityTypes = activityTypes.filter(act =>
        !rules.some(rule => rule.activity_type_id === act.id)
    );

    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            // Secara otomatis memilih id dari daftar aktifitas yang tersisa (jika ada)
            activity_type_id: availableActivityTypes.length > 0 ? availableActivityTypes[0].id : '',
            min_distance_km: '',
            reward_amount: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (rule) => {
        setModalMode('edit');
        setSelectedRuleId(rule.id);
        setSelectedActivityName(getActivityName(rule.activity_type_id));
        setFormData({
            activity_type_id: rule.activity_type_id,
            min_distance_km: rule.min_distance_km,
            reward_amount: activeTab === 'exp' ? rule.xp_awarded : rule.points_awarded,
            is_active: rule.is_active
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('jwt_token');
            const endpoint = activeTab === 'exp' ? 'xp-rules' : 'point-rules';

            let url = `${getBaseUrl()}/admin/${endpoint}`;
            let method = 'POST';
            let payload = {};

            if (modalMode === 'add') {
                payload = {
                    activity_type_id: Number(formData.activity_type_id),
                    min_distance_km: Number(formData.min_distance_km),
                    is_active: formData.is_active
                };
            } else {
                url = `${url}/${selectedRuleId}`;
                method = 'PUT';
                payload = {
                    min_distance_km: Number(formData.min_distance_km),
                    is_active: formData.is_active
                };
            }

            if (activeTab === 'exp') {
                payload.xp_awarded = Number(formData.reward_amount);
            } else {
                payload.points_awarded = Number(formData.reward_amount);
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            const json = await response.json();

            if (json.success || json.status === 'success') {
                closeModal();
                fetchRules();
                showToast(modalMode === 'add' ? `Aturan ${activeTab.toUpperCase()} berhasil ditambahkan!` : `Aturan ${activeTab.toUpperCase()} berhasil diperbarui!`);
            } else {
                alert(json.message || "Terjadi kesalahan saat menyimpan data.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!ruleToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const endpoint = activeTab === 'exp' ? 'xp-rules' : 'point-rules';
            const response = await fetch(`${getBaseUrl()}/admin/${endpoint}/${ruleToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success || json.status === 'success') {
                setIsDeleteModalOpen(false);
                setRuleToDelete(null);
                fetchRules();
                showToast(`Aturan ${activeTab.toUpperCase()} berhasil dihapus!`);
            }
        } catch (error) {
            alert("Gagal menghapus data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const filteredRules = rules.filter(rule => {
        const name = getActivityName(rule.activity_type_id).toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6 relative">

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-white border border-green-100 shadow-xl rounded-xl p-4 flex items-center space-x-3 pr-6">
                        <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle2 className="w-5 h-5 text-[#10B981]" /></div>
                        <div>
                            <p className="text-sm font-extrabold text-gray-900">Berhasil!</p>
                            <p className="text-xs font-medium text-gray-500">{toastMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER TITLE */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Aturan EXP dan Poin</h1>
                <p className="text-sm text-gray-500 mt-1">Halaman pengaturan aturan pendapatan exp dan point berdasarkan suatu aktifitas</p>
            </div>

            {/* TABS MENU */}
            <div className="border-b border-gray-200 mt-6">
                <nav className="flex space-x-8">
                    <button onClick={() => { setActiveTab('exp'); setSearchTerm(''); }} className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors ${activeTab === 'exp' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Aturan EXP
                    </button>
                    <button onClick={() => { setActiveTab('point'); setSearchTerm(''); }} className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors ${activeTab === 'point' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Aturan Poin
                    </button>
                </nav>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                <div className="relative w-full sm:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
                    <input type="text" placeholder="Cari aktifitas" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] focus:bg-white transition-all" />
                </div>

                <button onClick={openAddModal} className="flex items-center justify-center px-4 py-2.5 bg-[#5A2EFF] text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> {activeTab === 'exp' ? 'Tambah Aturan EXP' : 'Tambah Aturan Poin'}
                </button>
            </div>

            {/* TABLE DATA */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center w-16">No</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center">Nama Aktifitas</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center">Minimal jarak (KM)</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center">{activeTab === 'exp' ? 'Hadiah EXP' : 'Hadiah poin'}</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center w-32">Status</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Memuat data aturan...</td></tr>
                            ) : filteredRules.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Tidak ada data aturan.</td></tr>
                            ) : (
                                filteredRules.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800 text-center">{index + 1}</td>
                                        <td className="px-6 py-4 font-extrabold text-gray-900 text-center">{getActivityName(item.activity_type_id)}</td>
                                        <td className="px-6 py-4 font-bold text-gray-700 text-center">{item.min_distance_km}</td>
                                        <td className="px-6 py-4 font-bold text-gray-700 text-center">{activeTab === 'exp' ? item.xp_awarded : item.points_awarded}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {item.is_active ? 'AKTIF' : 'NONAKTIF'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-center space-x-2">
                                            <button onClick={() => openEditModal(item)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => { setRuleToDelete(item); setIsDeleteModalOpen(true); }} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL TAMBAH & EDIT RULES */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] flex flex-col overflow-hidden">

                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">
                                {modalMode === 'add'
                                    ? `Tambah Rules ${activeTab === 'exp' ? 'Exp' : 'Poin'}`
                                    : `Edit Rules ${activeTab === 'exp' ? 'Exp' : 'Poin'} (${selectedActivityName})`}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">

                                {/* Kode Aktifitas - HANYA MUNCUL SAAT ADD & DIFILTER */}
                                {modalMode === 'add' && (
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5">Kode Aktifitas</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <div className="w-5 h-5 bg-gray-200 text-gray-500 rounded flex items-center justify-center text-[10px] font-bold border border-gray-300">Ad</div>
                                            </div>
                                            <select
                                                required
                                                value={formData.activity_type_id}
                                                onChange={(e) => setFormData({ ...formData, activity_type_id: e.target.value })}
                                                className="w-full pl-11 pr-10 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                            >
                                                {/* Jika semua aktifitas sudah punya rules, beri peringatan di dropdown */}
                                                {availableActivityTypes.length === 0 ? (
                                                    <option value="" disabled>Semua aktifitas sudah memiliki aturan</option>
                                                ) : (
                                                    <option value="" disabled>Pilih Aktifitas</option>
                                                )}

                                                {/* HANYA MAP DATA YANG TERSEDIA */}
                                                {availableActivityTypes.map(act => (
                                                    <option key={act.id} value={act.id}>{act.name} ({act.code})</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-gray-500" /></div>
                                        </div>
                                    </div>
                                )}

                                {/* Minimal Jarak */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5">Minimal jarak (KM)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><MapPin className="w-4 h-4 text-gray-400" /></div>
                                        <input type="number" step="0.1" min="0" required placeholder="0" value={formData.min_distance_km} onChange={(e) => setFormData({ ...formData, min_distance_km: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all" />
                                    </div>
                                </div>

                                {/* Hadiah EXP / POIN Dinamis */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5">{activeTab === 'exp' ? 'Hadiah EXP' : 'Hadiah Poin'}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            {activeTab === 'exp' ? <span className="text-[10px] font-extrabold text-gray-500">XP</span> : <span className="text-sm">🪙</span>}
                                        </div>
                                        <input type="number" min="0" required placeholder="0" value={formData.reward_amount} onChange={(e) => setFormData({ ...formData, reward_amount: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all" />
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5">Status</label>
                                    <div className="relative">
                                        <select value={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })} className="w-full pl-4 pr-10 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all">
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-gray-500" /></div>
                                    </div>
                                </div>

                            </div>

                            <div className="px-6 py-5 border-t border-gray-100 bg-white flex space-x-3">
                                <button type="button" onClick={closeModal} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50">Batal</button>
                                {/* Tombol Simpan disable jika tidak ada aktifitas yang bisa dipilih di mode Tambah */}
                                <button type="submit" disabled={isSubmitting || (modalMode === 'add' && availableActivityTypes.length === 0)} className="flex-1 px-4 py-3 rounded-xl bg-[#10B981] text-white font-bold hover:bg-green-600 shadow-sm transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Memproses...' : 'Simpan'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

            {/* MODAL HAPUS */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5"><AlertTriangle className="w-8 h-8" /></div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Hapus Aturan?</h3>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">Anda akan menghapus aturan ini. Pengguna tidak akan mendapatkan hadiah yang sesuai untuk aktifitas ini lagi.</p>
                        <div className="flex space-x-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50">Batal</button>
                            <button onClick={executeDelete} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50">
                                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}