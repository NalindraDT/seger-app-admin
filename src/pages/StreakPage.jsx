import { useState, useEffect } from 'react';
import {
    Flame, Plus, Edit, Trash2, X, CheckCircle2,
    Target, Star, Award, ChevronDown, Info, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { getBaseUrl } from '../utils/apiConfig';

export default function StreakPage() {
    const [rules, setRules] = useState([]);
    const [badges, setBadges] = useState([]); // STATE UNTUK DROPDOWN BADGE
    const [isLoading, setIsLoading] = useState(true);

    // STATE MODAL
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [selectedRule, setSelectedRule] = useState(null);

    // FORM DATA
    const [formData, setFormData] = useState({
        milestone_days: '',
        xp_reward: '',
        badge_id: '',
        is_active: true
    });

    // FETCH ATURAN STREAK
    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/streak-rules`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                const sortedData = (json.data || []).sort((a, b) => a.milestone_days - b.milestone_days);
                setRules(sortedData);
            } else {
                setRules([]);
            }
        } catch (error) {
            console.error("Gagal mengambil data streak rules", error);
        } finally {
            setIsLoading(false);
        }
    };

    // FETCH BADGES UNTUK DROPDOWN
    const fetchBadges = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/badges`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                // HANYA AMBIL BADGE YANG USE_IN_STREAK == TRUE
                const streakBadges = (json.data.items || []).filter(b => b.use_in_streak === true);
                setBadges(streakBadges);
            }
        } catch (error) {
            console.error("Gagal mengambil data badge", error);
        }
    };

    useEffect(() => {
        fetchRules();
        fetchBadges();
    }, []);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 4000);
    };

    // HANDLER MODAL
    const openAddModal = () => {
        setFormData({ milestone_days: '', xp_reward: '', badge_id: '', is_active: true });
        setIsAddModalOpen(true);
    };

    const openEditModal = (rule) => {
        setSelectedRule(rule);
        setFormData({
            milestone_days: rule.milestone_days,
            xp_reward: rule.xp_reward,
            badge_id: rule.badge_id ? rule.badge_id : '',
            is_active: rule.is_active
        });
        setIsEditModalOpen(true);
    };

    const openDetailModal = (rule) => {
        setSelectedRule(rule);
        setIsDetailModalOpen(true);
    };

    const openDeleteModal = (rule) => {
        setSelectedRule(rule);
        setIsDeleteModalOpen(true);
    };

    // FUNGSI SUBMIT (POST & PUT)
    const handleSubmit = async (e, mode) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');

            const payload = {
                milestone_days: Number(formData.milestone_days),
                xp_reward: Number(formData.xp_reward),
                badge_id: formData.badge_id ? Number(formData.badge_id) : null,
                is_active: formData.is_active
            };

            const url = mode === 'add'
                ? `${getBaseUrl()}/admin/streak-rules`
                : `${getBaseUrl()}/admin/streak-rules/${selectedRule.id}`;

            const response = await fetch(url, {
                method: mode === 'add' ? 'POST' : 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const json = await response.json();
            if (json.success || json.status === 'success') {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                fetchRules();
                showToast(mode === 'add' ? 'Aturan streak berhasil ditambahkan!' : 'Aturan streak berhasil diperbarui!');
            } else {
                alert(json.message || "Terjadi kesalahan saat menyimpan aturan.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // FUNGSI DELETE
    const handleDelete = async () => {
        if (!selectedRule) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/streak-rules/${selectedRule.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success || json.status === 'success') {
                setIsDeleteModalOpen(false);
                setSelectedRule(null);
                fetchRules();
                showToast('Aturan streak telah dihapus!');
            } else {
                alert(json.message || "Gagal menghapus aturan.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // HELPER UNTUK MENDAPATKAN NAMA BADGE DARI ID
    const getBadgeName = (id) => {
        if (!id) return "-";
        const found = badges.find(b => b.id === id);
        return found ? found.name : `Badge #${id}`;
    };

    return (
        <div className="space-y-6 relative">
            {/* TOAST */}
            {toastMessage && (
                <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-white border border-green-100 shadow-xl rounded-xl p-4 flex items-center space-x-3 pr-6">
                        <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle2 className="w-5 h-5 text-[#10B981]" /></div>
                        <div><p className="text-sm font-extrabold text-gray-900">Sistem</p><p className="text-xs font-medium text-gray-500">{toastMessage}</p></div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Aturan Streak</h1>
                <p className="text-sm text-gray-500 mt-1">Atur hadiah EXP dan Badge saat user mencapai target hari berturut-turut</p>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Total: {rules.length} Aturan</span>
                </div>

                <button onClick={openAddModal} className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition-colors">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Aturan
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100 font-bold text-gray-600 text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-center w-16">No.</th>
                                <th className="px-6 py-4 text-center">Target Hari (Streak)</th>
                                <th className="px-6 py-4 text-center">Hadiah EXP</th>
                                <th className="px-6 py-4 text-center">Badge Spesial</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Memuat data aturan streak...</td></tr>
                            ) : rules.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Belum ada data aturan.</td></tr>
                            ) : (
                                rules.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800 text-center">{index + 1}</td>
                                        <td className="px-6 py-4 font-black text-orange-500 text-center text-lg">
                                            <div className="flex items-center justify-center space-x-1">
                                                <Flame className="w-5 h-5" /> <span>{item.milestone_days} Hari</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700 text-center">
                                            +{item.xp_reward} EXP
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.badge_id ? (
                                                <span className="px-3 py-1 bg-indigo-50 text-[#5A2EFF] rounded-md text-[10px] font-extrabold uppercase shadow-sm border border-indigo-100">
                                                    {getBadgeName(item.badge_id)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 font-medium text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {item.is_active ? 'AKTIF' : 'OFF'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => openEditModal(item)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => openDeleteModal(item)} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => openDetailModal(item)} className="p-1.5 bg-indigo-50 text-[#5A2EFF] rounded-md hover:bg-indigo-100" title="Detail"><Info className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========================================= */}
            {/* MODAL FORM (REUSABLE TAMBAH & EDIT)       */}
            {/* ========================================= */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col my-auto border border-gray-100 overflow-hidden">

                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200">
                                    <Flame className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-gray-900">{isAddModalOpen ? 'Tambah Aturan Streak' : 'Edit Aturan Streak'}</h2>
                                    <p className="text-[11px] font-medium text-gray-500">Tentukan bonus saat pencapaian hari</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={(e) => handleSubmit(e, isAddModalOpen ? 'add' : 'edit')}>
                            <div className="p-8 space-y-6 bg-white">

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Target Hari (Streak)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Target className="w-4 h-4 text-gray-400" /></div>
                                            <input
                                                type="number" min="1" required placeholder="Misal: 7"
                                                value={formData.milestone_days} onChange={(e) => setFormData({ ...formData, milestone_days: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Hadiah EXP</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Star className="w-4 h-4 text-gray-400" /></div>
                                            <input
                                                type="number" min="0" required placeholder="Misal: 10"
                                                value={formData.xp_reward} onChange={(e) => setFormData({ ...formData, xp_reward: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Pilih Badge Spesial (Opsional)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Award className="w-4 h-4 text-[#5A2EFF]" /></div>
                                        <select
                                            value={formData.badge_id}
                                            onChange={(e) => setFormData({ ...formData, badge_id: e.target.value })}
                                            className="w-full pl-10 pr-10 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                        >
                                            <option value="">-- Tidak Memberikan Badge --</option>
                                            {badges.map(badge => (
                                                <option key={badge.id} value={badge.id}>
                                                    {badge.name} (Tier {badge.tier})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-gray-500" /></div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1.5">Hanya menampilkan badge yang dikonfigurasi "Use in Streak".</p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Status Aturan</label>
                                    <div className="relative">
                                        <select
                                            value={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                                            className="w-full pl-4 pr-10 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                        >
                                            <option value="true">Active (Berlaku)</option>
                                            <option value="false">Inactive (Dimatikan)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-gray-500" /></div>
                                    </div>
                                </div>

                            </div>
                            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-6 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-white transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center">
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Aturan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL DETAIL (VIEW ONLY)                  */}
            {/* ========================================= */}
            {isDetailModalOpen && selectedRule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 text-center pb-6">

                        <div className="px-6 py-4 flex justify-end">
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-8 flex flex-col items-center">
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 mb-4 shadow-inner">
                                <Flame className="w-10 h-10 text-orange-500" />
                            </div>

                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Streak {selectedRule.milestone_days} Hari</h2>
                            <span className={`mt-2 mb-6 px-3 py-1 rounded-md text-[10px] font-extrabold uppercase ${selectedRule.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {selectedRule.is_active ? 'Status Aktif' : 'Status Non-Aktif'}
                            </span>

                            <div className="w-full space-y-3">
                                <div className="bg-[#F8F9FC] border border-gray-100 rounded-2xl p-4 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center"><Star className="w-4 h-4 mr-2 text-orange-400" /> Hadiah EXP</span>
                                    <span className="text-lg font-black text-orange-500">+{selectedRule.xp_reward}</span>
                                </div>

                                <div className="bg-[#F8F9FC] border border-gray-100 rounded-2xl p-4 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center"><ShieldCheck className="w-4 h-4 mr-2 text-[#5A2EFF]" /> Badge</span>
                                    {selectedRule.badge_id ? (
                                        <span className="text-sm font-bold text-[#5A2EFF] bg-indigo-50 px-3 py-1 rounded-md">{getBadgeName(selectedRule.badge_id)}</span>
                                    ) : (
                                        <span className="text-sm font-bold text-gray-400">Tidak ada</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL HAPUS (VERIFIKASI)                  */}
            {/* ========================================= */}
            {isDeleteModalOpen && selectedRule && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Hapus Aturan Streak?</h3>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Anda akan menghapus aturan untuk streak <strong className="text-orange-500">{selectedRule.milestone_days} Hari</strong>. Pengguna tidak akan mendapatkan bonus ini lagi.
                        </p>
                        <div className="flex space-x-3">
                            <button onClick={() => { setIsDeleteModalOpen(false); setSelectedRule(null); }} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50">Batal</button>
                            <button onClick={handleDelete} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50">
                                {isSubmitting ? 'Memproses...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}