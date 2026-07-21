import { useState, useEffect } from 'react';
import {
    Filter, Plus, Edit, Trash2, Link2, ChevronLeft, ChevronRight,
    Image as ImageIcon, X, Gift, Coins, Package, AlignLeft, ChevronDown,
    UploadCloud, CheckCircle2, Eye, Info, AlertTriangle, CheckSquare, Clock
} from 'lucide-react';
import { getBaseUrl } from '../utils/apiConfig';

export default function RewardsPage() {
    // =========================================================================
    // STATE GLOBAL & HADIAH
    // =========================================================================
    const [activeTab, setActiveTab] = useState('hadiah');
    const [rewards, setRewards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [selectedReward, setSelectedReward] = useState(null);
    const [rewardToDelete, setRewardToDelete] = useState(null);

    const [formData, setFormData] = useState({
        name: '', description: '', points_cost: '', stock_qty: '', is_active: true, image: null, imagePreview: null
    });

    // =========================================================================
    // STATE REDEEM (PENUKARAN)
    // =========================================================================
    const [redemptions, setRedemptions] = useState([]);
    const [isRedemptionsLoading, setIsRedemptionsLoading] = useState(true);
    const [redemptionsPage, setRedemptionsPage] = useState(1);
    const [redemptionsTotalPages, setRedemptionsTotalPages] = useState(1);
    const [totalRedemptions, setTotalRedemptions] = useState(0);

    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
    const [selectedRedemption, setSelectedRedemption] = useState(null);
    const [adminNote, setAdminNote] = useState('');

    // =========================================================================
    // FETCH DATA
    // =========================================================================
    const fetchRewards = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/rewards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) setRewards(json.data);
        } catch (error) {
            console.error("Gagal mengambil data hadiah", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRedemptions = async () => {
        setIsRedemptionsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/reward-redemptions?page=${redemptionsPage}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) {
                setRedemptions(json.data.items);
                setRedemptionsTotalPages(json.data.pagination.totalPages);
                setTotalRedemptions(json.data.pagination.totalItems);
            }
        } catch (error) {
            console.error("Gagal mengambil data penukaran", error);
        } finally {
            setIsRedemptionsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'hadiah') {
            fetchRewards();
        } else {
            fetchRedemptions();
        }
    }, [activeTab, redemptionsPage]);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 4000);
    };

    // =========================================================================
    // HANDLERS HADIAH
    // =========================================================================
    const openAddModal = () => {
        setFormData({ name: '', description: '', points_cost: '', stock_qty: '', is_active: true, image: null, imagePreview: null });
        setIsAddModalOpen(true);
    };

    const openEditModal = (reward) => {
        setSelectedReward(reward);
        setFormData({ name: reward.name, description: reward.description, points_cost: reward.points_cost, stock_qty: reward.stock_qty, is_active: reward.is_active, image: null, imagePreview: reward.image });
        setIsEditModalOpen(true);
    };

    const openDetailModal = (reward) => { setSelectedReward(reward); setIsDetailModalOpen(true); };
    const openDeleteModal = (reward) => { setRewardToDelete(reward); setIsDeleteModalOpen(true); };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setFormData({ ...formData, image: file, imagePreview: URL.createObjectURL(file) });
    };

    const handleSubmitReward = async (e, mode) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('points_cost', Number(formData.points_cost));
            data.append('stock_qty', Number(formData.stock_qty));
            data.append('is_active', formData.is_active);
            if (formData.image) data.append('image', formData.image);

            const url = mode === 'add' ? `${getBaseUrl()}/admin/rewards` : `${getBaseUrl()}/admin/rewards/${selectedReward.id}`;
            const response = await fetch(url, { method: mode === 'add' ? 'POST' : 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: data });
            const json = await response.json();

            if (json.success || json.status === 'success') {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                fetchRewards();
                showToast(mode === 'add' ? 'Hadiah berhasil ditambahkan!' : 'Hadiah berhasil diperbarui!');
            } else {
                alert(json.message || "Terjadi kesalahan.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReward = async () => {
        if (!rewardToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/rewards/${rewardToDelete.id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success || json.status === 'success') {
                setIsDeleteModalOpen(false);
                setRewardToDelete(null);
                fetchRewards();
                showToast('Hadiah telah dihapus!');
            } else {
                alert(json.message || "Gagal menghapus hadiah.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // =========================================================================
    // HANDLERS REDEEM
    // =========================================================================
    const openProcessModal = (redemption) => {
        setSelectedRedemption(redemption);
        setAdminNote(redemption.admin_note || '');
        setIsProcessModalOpen(true);
    };

    const handleProcessRedemption = async (e) => {
        e.preventDefault();
        if (!selectedRedemption) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/reward-redemptions/${selectedRedemption.id}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    status: 'processed', // Sesuai instruksi: admin hanya bisa ACC/Processed
                    admin_note: adminNote || 'Hadiah telah diproses dan siap diberikan.'
                })
            });

            const json = await response.json();
            if (json.success || json.status === 'success') {
                setIsProcessModalOpen(false);
                setSelectedRedemption(null);
                setAdminNote('');
                fetchRedemptions();
                showToast('Penukaran hadiah berhasil di-ACC!');
            } else {
                alert(json.message || "Gagal memproses penukaran.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
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
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hadiah</h1>
                <p className="text-sm text-gray-500 mt-1">Pengaturan katalog dan penukaran hadiah user</p>
            </div>

            {/* TABS */}
            <div className="border-b border-gray-200 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <nav className="flex space-x-8">
                    <button onClick={() => setActiveTab('hadiah')} className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors ${activeTab === 'hadiah' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Katalog Hadiah
                    </button>
                    <button onClick={() => { setActiveTab('redeem'); setRedemptionsPage(1); }} className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors ${activeTab === 'redeem' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Daftar Penukaran (Redeem)
                    </button>
                </nav>
                {activeTab === 'hadiah' && (
                    <button onClick={openAddModal} className="flex items-center justify-center px-4 py-2 bg-[#5A2EFF] text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition-colors mb-2 sm:mb-0">
                        <Plus className="w-3.5 h-3.5 mr-2" /> Tambah Hadiah
                    </button>
                )}
            </div>

            {/* ================================================================================================= */}
            {/* VIEW: TAB HADIAH */}
            {/* ================================================================================================= */}
            {activeTab === 'hadiah' && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#F8F9FC] border-b border-gray-100 font-bold text-gray-600 text-[11px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-center w-16">No.</th>
                                    <th className="px-6 py-4 text-center w-24">Gambar</th>
                                    <th className="px-6 py-4">Nama Hadiah</th>
                                    <th className="px-6 py-4 text-center">Biaya</th>
                                    <th className="px-6 py-4 text-center">Stock</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Memuat data katalog...</td></tr>
                                ) : rewards.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Belum ada data hadiah.</td></tr>
                                ) : (
                                    rewards.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-800 text-center">{index + 1}</td>
                                            <td className="px-6 py-4 flex justify-center">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                                                    {item.image ? (
                                                        <img src={item.image.startsWith('http') ? item.image : `https://pltuapp.potydev.cloud/${item.image}`} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${item.name}&background=F3F4F6&color=9CA3AF&size=128`; }} />
                                                    ) : <ImageIcon className="w-5 h-5 text-gray-400" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-extrabold text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 font-bold text-gray-700 text-center">🪙 {item.points_cost}</td>
                                            <td className="px-6 py-4 font-bold text-gray-700 text-center">{item.stock_qty}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{item.is_active ? 'AKTIF' : 'OFF'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button onClick={() => openEditModal(item)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => openDeleteModal(item)} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => openDetailModal(item)} className="p-1.5 bg-indigo-50 text-[#5A2EFF] rounded-md hover:bg-indigo-100" title="Detail"><Eye className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ================================================================================================= */}
            {/* VIEW: TAB REDEEM (PENUKARAN) */}
            {/* ================================================================================================= */}
            {activeTab === 'redeem' && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#F8F9FC] border-b border-gray-100 font-bold text-gray-600 text-[11px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-center w-16">No.</th>
                                    <th className="px-6 py-4">Peserta</th>
                                    <th className="px-6 py-4">Hadiah Ditukar</th>
                                    <th className="px-6 py-4 text-center">Qty / Poin</th>
                                    <th className="px-6 py-4 text-center">Waktu Request</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center w-28">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isRedemptionsLoading ? (
                                    <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Memuat data penukaran...</td></tr>
                                ) : redemptions.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Belum ada riwayat penukaran.</td></tr>
                                ) : (
                                    redemptions.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-800 text-center">{((redemptionsPage - 1) * 10) + index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <img src={`https://ui-avatars.com/api/?name=${item.participant_name}&background=random`} alt="Avatar" className="w-8 h-8 rounded-full" />
                                                    <span className="font-bold text-gray-800">{item.participant_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-[#5A2EFF]">{item.reward_name}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="font-bold text-gray-800">{item.quantity} pcs</div>
                                                <div className="text-xs text-gray-500 font-medium">🪙 {item.points_spent} pt</div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs font-medium text-gray-500">
                                                {new Date(item.requested_at).toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase ${item.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.status === 'PENDING' ? (
                                                    <button
                                                        onClick={() => openProcessModal(item)}
                                                        className="px-4 py-1.5 bg-[#10B981] text-white rounded-lg text-[11px] font-bold hover:bg-green-600 shadow-sm transition-colors flex items-center justify-center w-full"
                                                    >
                                                        <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> ACC
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => openProcessModal(item)} // Kita buka modal yang sama tapi view-only
                                                        className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold hover:bg-gray-200 transition-colors flex items-center justify-center w-full"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Detail
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Redeem */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                        <p className="text-sm text-gray-500 font-medium">Showing {redemptions.length > 0 ? ((redemptionsPage - 1) * 10) + 1 : 0}-{Math.min(redemptionsPage * 10, totalRedemptions)} of {totalRedemptions}</p>
                        <div className="flex space-x-1">
                            <button onClick={() => setRedemptionsPage(p => Math.max(1, p - 1))} disabled={redemptionsPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#5A2EFF] text-white font-bold text-sm">{redemptionsPage}</button>
                            <button onClick={() => setRedemptionsPage(p => Math.min(redemptionsTotalPages, p + 1))} disabled={redemptionsPage === redemptionsTotalPages || redemptionsTotalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================================================= */}
            {/* MODAL REDEEM: ACC / DETAIL PROSES */}
            {/* ================================================================================================= */}
            {isProcessModalOpen && selectedRedemption && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-[#F8F9FC]">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedRedemption.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                    {selectedRedemption.status === 'PENDING' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-gray-900">{selectedRedemption.status === 'PENDING' ? 'Proses Penukaran' : 'Detail Penukaran'}</h2>
                                    <p className="text-[10px] font-medium text-gray-500 uppercase">ID: {selectedRedemption.id.substring(0, 8)}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsProcessModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleProcessRedemption} className="p-6 space-y-6">
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Peserta</span>
                                    <span className="text-sm font-extrabold text-gray-900">{selectedRedemption.participant_name}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Hadiah</span>
                                    <span className="text-sm font-bold text-[#5A2EFF]">{selectedRedemption.reward_name}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Jumlah</span>
                                    <span className="text-sm font-bold text-gray-900">{selectedRedemption.quantity} pcs</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Total Poin</span>
                                    <span className="text-sm font-bold text-gray-900">🪙 {selectedRedemption.points_spent} pt</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">
                                    {selectedRedemption.status === 'PENDING' ? 'Catatan Admin (Opsional)' : 'Catatan Admin'}
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Misal: Hadiah sedang diproses dan akan dikirim..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    disabled={selectedRedemption.status !== 'PENDING'}
                                    className="w-full px-4 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] resize-none disabled:bg-gray-100 disabled:text-gray-500"
                                ></textarea>
                            </div>

                            {selectedRedemption.status === 'PENDING' ? (
                                <div className="flex space-x-3 pt-2">
                                    <button type="button" onClick={() => setIsProcessModalOpen(false)} disabled={isSubmitting} className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50">Batal</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3.5 rounded-xl bg-[#10B981] text-white font-bold hover:bg-green-600 shadow-sm flex items-center justify-center disabled:opacity-50">
                                        {isSubmitting ? 'Memproses...' : <><CheckSquare className="w-4 h-4 mr-2" /> ACC Penukaran</>}
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <p className="text-xs text-center font-bold text-green-600 mb-4 bg-green-50 py-2 rounded-lg border border-green-100">
                                        Telah diproses pada: {new Date(selectedRedemption.processed_at).toLocaleString('id-ID')}
                                    </p>
                                    {/* <button type="button" onClick={() => setIsProcessModalOpen(false)} className="w-full px-4 py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 shadow-sm">Tutup Detail</button> */}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* ================================================================================================= */}
            {/* MODAL HADIAH: ADD, EDIT, DELETE, DETAIL (KODE SAMA SEPERTI SEBELUMNYA) */}
            {/* ================================================================================================= */}
            {/* --- KODE MODAL HADIAH BAWAAN DI BAWAH INI TIDAK SAYA HAPUS --- */}

            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col my-auto border border-gray-100">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center space-x-3"><div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100"><Gift className="w-5 h-5 text-[#5A2EFF]" /></div><div><h2 className="text-lg font-extrabold text-gray-900">{isAddModalOpen ? 'Tambah Hadiah baru' : 'Edit Hadiah'}</h2><p className="text-[11px] font-medium text-gray-500">Lengkapi informasi katalog hadiah</p></div></div>
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={(e) => handleSubmitReward(e, isAddModalOpen ? 'add' : 'edit')}>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                                <div className="space-y-5">
                                    <div><label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Nama Hadiah</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Gift className="w-4 h-4 text-gray-400" /></div><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all" /></div></div>
                                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Biaya</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Coins className="w-4 h-4 text-gray-400" /></div><input type="number" required value={formData.points_cost} onChange={(e) => setFormData({ ...formData, points_cost: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none" /></div></div><div><label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Stock</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Package className="w-4 h-4 text-gray-400" /></div><input type="number" required value={formData.stock_qty} onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none" /></div></div></div>
                                    <div><label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Deskripsi</label><div className="relative"><div className="absolute top-3 left-3.5 pointer-events-none"><AlignLeft className="w-4 h-4 text-gray-400" /></div><textarea required rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] resize-none transition-all"></textarea></div></div>
                                    <div><label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label><div className="relative"><select value={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })} className="w-full pl-4 pr-10 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"><option value="true">Active</option><option value="false">Inactive</option></select><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-gray-500" /></div></div></div>
                                </div>
                                <div className="flex flex-col"><label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Upload Gambar</label><div className="flex-1 bg-[#F8F9FC] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden group hover:border-[#5A2EFF] transition-colors">{formData.imagePreview ? (<><img src={formData.imagePreview.startsWith('blob:') || formData.imagePreview.startsWith('http') ? formData.imagePreview : `https://pltuapp.potydev.cloud/${formData.imagePreview}`} className="w-full h-full object-cover absolute inset-0 z-0" alt="Preview" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10"><UploadCloud className="w-8 h-8 text-white mb-2" /><span className="text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">Ganti Gambar</span></div></>) : (<div className="flex flex-col items-center text-center z-10"><div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100"><ImageIcon className="w-8 h-8 text-gray-400" /></div><p className="text-sm font-bold text-gray-700 mb-1">Pilih Gambar</p></div>)}<input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" /></div></div>
                            </div>
                            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3"><button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-6 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-white transition-colors">Batal</button><button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-[#5A2EFF] text-white font-bold shadow-sm hover:bg-indigo-700 transition-colors">{isSubmitting ? 'Proses...' : 'Simpan Hadiah'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {isDetailModalOpen && selectedReward && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100"><Info className="w-5 h-5 text-[#5A2EFF]" /></div><div><h2 className="text-lg font-extrabold text-gray-900">Detail Hadiah</h2><p className="text-[11px] font-medium text-gray-500">Informasi katalog lengkap</p></div></div><button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl"><X className="w-5 h-5" /></button></div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white"><div className="w-full aspect-square bg-gray-100 rounded-3xl overflow-hidden border border-gray-100 shadow-inner"><img src={selectedReward.image?.startsWith('http') ? selectedReward.image : `https://pltuapp.potydev.cloud/${selectedReward.image}`} className="w-full h-full object-cover" alt="Detail" onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=Reward&background=F3F4F6"; }} /></div><div className="space-y-6"><div><h3 className="text-2xl font-black text-gray-900 leading-tight">{selectedReward.name}</h3><span className={`inline-block mt-2 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${selectedReward.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{selectedReward.is_active ? 'Active' : 'Inactive'}</span></div><div className="grid grid-cols-2 gap-4"><div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100"><p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Poin</p><p className="text-xl font-black text-[#5A2EFF]">🪙 {selectedReward.points_cost}</p></div><div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100"><p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Stok</p><p className="text-xl font-black text-gray-800">{selectedReward.stock_qty} pcs</p></div></div><div><label className="text-[10px] font-bold text-gray-500 uppercase">Deskripsi</label><p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">{selectedReward.description}</p></div></div></div>
                        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end"><button onClick={() => setIsDetailModalOpen(false)} className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm">Tutup</button></div>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && rewardToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5"><AlertTriangle className="w-8 h-8" /></div><h3 className="text-xl font-extrabold text-gray-900 mb-2">Hapus Hadiah?</h3><p className="text-sm text-gray-500 mb-8 leading-relaxed">Anda akan menghapus hadiah <strong className="text-gray-700">"{rewardToDelete.name}"</strong>. Pengguna tidak akan dapat menukarkan poin dengan hadiah ini lagi.</p>
                        <div className="flex space-x-3"><button onClick={() => { setIsDeleteModalOpen(false); setRewardToDelete(null); }} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50">Batal</button><button onClick={handleDeleteReward} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50">{isSubmitting ? 'Memproses...' : 'Ya, Hapus'}</button></div>
                    </div>
                </div>
            )}

        </div>
    );
}
