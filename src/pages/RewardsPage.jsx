import { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, ChevronLeft, ChevronRight,
    Image as ImageIcon, Gift, Coins, Package, AlignLeft,
    Eye, Info, CheckSquare, Clock
} from 'lucide-react';
import {
    FormField, Input, Select, Textarea, Button, Modal, Toast, PageHeader, ConfirmModal, FileUpload
} from '../components/ui';
import { getBaseUrl } from '../utils/apiConfig';
import { isApiSuccess, getApiErrorMessage } from '../utils/apiFeedback';

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
    const [toastType, setToastType] = useState('success');
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

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('success');
        }, 4000);
    };

    const getRedemptionStatusStyle = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'PENDING': return 'bg-orange-50 text-orange-600';
            case 'PROCESSED': return 'bg-green-50 text-green-600';
            case 'REJECTED': return 'bg-red-50 text-red-600';
            case 'RECEIVED': return 'bg-indigo-50 text-indigo-600';
            default: return 'bg-gray-50 text-gray-600';
        }
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

            if (isApiSuccess(json)) {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                fetchRewards();
                showToast(mode === 'add' ? 'Hadiah berhasil ditambahkan!' : 'Hadiah berhasil diperbarui!');
            } else {
                showToast(getApiErrorMessage(json, 'Terjadi kesalahan.'), 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan jaringan.', 'error');
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
            if (isApiSuccess(json)) {
                setIsDeleteModalOpen(false);
                setRewardToDelete(null);
                fetchRewards();
                showToast('Hadiah telah dihapus!');
            } else {
                setIsDeleteModalOpen(false);
                setRewardToDelete(null);
                showToast(getApiErrorMessage(json, 'Gagal menghapus hadiah.'), 'error');
            }
        } catch (error) {
            setIsDeleteModalOpen(false);
            setRewardToDelete(null);
            showToast('Terjadi kesalahan jaringan.', 'error');
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
                    status: 'processed',
                    admin_note: adminNote || 'Hadiah telah diproses dan siap diberikan.'
                })
            });

            const json = await response.json();
            if (isApiSuccess(json)) {
                setIsProcessModalOpen(false);
                setSelectedRedemption(null);
                setAdminNote('');
                fetchRedemptions();
                showToast('Penukaran hadiah berhasil di-ACC!');
            } else {
                setIsProcessModalOpen(false);
                setSelectedRedemption(null);
                showToast(getApiErrorMessage(json, 'Gagal memproses penukaran.'), 'error');
            }
        } catch (error) {
            setIsProcessModalOpen(false);
            setSelectedRedemption(null);
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectRedemption = async () => {
        if (!selectedRedemption) return;
        if (!adminNote.trim()) {
            showToast('Catatan penolakan wajib diisi sebelum menolak penukaran hadiah.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/reward-redemptions/${selectedRedemption.id}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    status: 'rejected',
                    admin_note: adminNote.trim(),
                })
            });

            const json = await response.json();
            if (isApiSuccess(json)) {
                setIsProcessModalOpen(false);
                setSelectedRedemption(null);
                setAdminNote('');
                fetchRedemptions();
                showToast('Penukaran hadiah ditolak.');
            } else {
                setIsProcessModalOpen(false);
                setSelectedRedemption(null);
                showToast(getApiErrorMessage(json, 'Gagal menolak penukaran.'), 'error');
            }
        } catch (error) {
            setIsProcessModalOpen(false);
            setSelectedRedemption(null);
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

            <PageHeader
                title="Hadiah"
                subtitle="Pengaturan katalog dan penukaran hadiah user"
            />

            {/* TABS */}
            <div className="border-b border-gray-200 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto">
                    <button onClick={() => setActiveTab('hadiah')} className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'hadiah' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Katalog Hadiah
                    </button>
                    <button onClick={() => { setActiveTab('redeem'); setRedemptionsPage(1); }} className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'redeem' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Daftar Penukaran (Redeem)
                    </button>
                </nav>
                {activeTab === 'hadiah' && (
                    <Button icon={Plus} onClick={openAddModal} className="mb-2 sm:mb-0">
                        Tambah Hadiah
                    </Button>
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
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${item.name}&background=F3F4F6&color=9CA3AF&size=128`; }} />
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
                                                <span className={`px-2.5 py-1.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase ${getRedemptionStatusStyle(item.status)}`}>
                                                    {item.status}
                                                </span>
                                                {item.status === 'RECEIVED' && item.received_at && (
                                                    <div className="text-[10px] text-indigo-500 font-medium mt-1">
                                                        Diterima: {new Date(item.received_at).toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
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
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white">
                        <p className="text-sm text-gray-500 font-medium">Showing {redemptions.length > 0 ? ((redemptionsPage - 1) * 10) + 1 : 0}-{Math.min(redemptionsPage * 10, totalRedemptions)} of {totalRedemptions}</p>
                        <div className="flex space-x-1">
                            <button onClick={() => setRedemptionsPage(p => Math.max(1, p - 1))} disabled={redemptionsPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                            {(function () {
                                const pages = [];
                                const maxVisible = 5;
                                let start = Math.max(1, redemptionsPage - Math.floor(maxVisible / 2));
                                const end = Math.min(redemptionsTotalPages, start + maxVisible - 1);
                                if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
                                for (let i = start; i <= end; i++) pages.push(i);
                                return pages.map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setRedemptionsPage(page)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold transition-colors ${page === redemptionsPage ? 'bg-[#5A2EFF] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {page}
                                    </button>
                                ));
                            })()}
                            <button onClick={() => setRedemptionsPage(p => Math.min(redemptionsTotalPages, p + 1))} disabled={redemptionsPage === redemptionsTotalPages || redemptionsTotalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                open={isProcessModalOpen && !!selectedRedemption}
                onClose={() => setIsProcessModalOpen(false)}
                title={selectedRedemption?.status === 'PENDING' ? 'Proses Penukaran' : 'Detail Penukaran'}
                subtitle={selectedRedemption ? `ID: ${selectedRedemption.id.substring(0, 8)}` : ''}
                icon={selectedRedemption?.status === 'PENDING' ? Clock : CheckSquare}
                size="md"
                footer={
                    selectedRedemption?.status === 'PENDING' ? (
                        <>
                            <Button variant="secondary" className="flex-1" onClick={() => setIsProcessModalOpen(false)} disabled={isSubmitting}>
                                Batal
                            </Button>
                            <Button variant="danger" className="flex-1" onClick={handleRejectRedemption} loading={isSubmitting}>
                                Tolak
                            </Button>
                            <Button type="submit" form="process-redemption-form" variant="success" className="flex-1" loading={isSubmitting} icon={CheckSquare}>
                                ACC
                            </Button>
                        </>
                    ) : null
                }
            >
                <form id="process-redemption-form" onSubmit={handleProcessRedemption} className="admin-form space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-500 uppercase">Peserta</span>
                            <span className="text-sm font-extrabold text-gray-900">{selectedRedemption?.participant_name}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-500 uppercase">Hadiah</span>
                            <span className="text-sm font-bold text-[#5A2EFF]">{selectedRedemption?.reward_name}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-500 uppercase">Jumlah</span>
                            <span className="text-sm font-bold text-gray-900">{selectedRedemption?.quantity} pcs</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase">Total Poin</span>
                            <span className="text-sm font-bold text-gray-900">🪙 {selectedRedemption?.points_spent} pt</span>
                        </div>
                    </div>

                    <FormField label={selectedRedemption?.status === 'PENDING' ? 'Catatan Admin (Opsional)' : 'Catatan Admin'}>
                        <Textarea
                            rows={3}
                            placeholder="Misal: Hadiah sedang diproses dan akan dikirim..."
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            disabled={selectedRedemption?.status !== 'PENDING'}
                        />
                    </FormField>

                    {selectedRedemption?.status !== 'PENDING' && (
                        <div className="space-y-3">
                            {selectedRedemption?.status === 'PROCESSED' && selectedRedemption.processed_at && (
                                <p className="text-xs text-center font-bold text-green-600 bg-green-50 py-2 rounded-lg border border-green-100">
                                    Telah diproses pada: {new Date(selectedRedemption.processed_at).toLocaleString('id-ID')}
                                </p>
                            )}
                            {selectedRedemption?.status === 'REJECTED' && (
                                <p className="text-xs text-center font-bold text-red-600 bg-red-50 py-2 rounded-lg border border-red-100">
                                    Penukaran ditolak{selectedRedemption.processed_at ? ` pada: ${new Date(selectedRedemption.processed_at).toLocaleString('id-ID')}` : ''}
                                </p>
                            )}
                            {selectedRedemption?.status === 'RECEIVED' && selectedRedemption.received_at && (
                                <p className="text-xs text-center font-bold text-indigo-600 bg-indigo-50 py-2 rounded-lg border border-indigo-100">
                                    Hadiah diterima user pada: {new Date(selectedRedemption.received_at).toLocaleString('id-ID')}
                                </p>
                            )}
                        </div>
                    )}
                </form>
            </Modal>

            <Modal
                open={isAddModalOpen || isEditModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                title={isAddModalOpen ? 'Tambah Hadiah baru' : 'Edit Hadiah'}
                subtitle="Lengkapi informasi katalog hadiah"
                icon={Gift}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                            Batal
                        </Button>
                        <Button type="submit" form="reward-form" variant="primary" loading={isSubmitting}>
                            Simpan Hadiah
                        </Button>
                    </>
                }
            >
                <form id="reward-form" onSubmit={(e) => handleSubmitReward(e, isAddModalOpen ? 'add' : 'edit')} className="admin-form space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <FormField label="Nama Hadiah" required>
                                <Input icon={Gift} type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </FormField>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Biaya" required>
                                    <Input icon={Coins} type="number" required value={formData.points_cost} onChange={(e) => setFormData({ ...formData, points_cost: e.target.value })} />
                                </FormField>
                                <FormField label="Stock" required>
                                    <Input icon={Package} type="number" required value={formData.stock_qty} onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })} />
                                </FormField>
                            </div>
                            <FormField label="Deskripsi" required>
                                <Textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </FormField>
                            <FormField label="Status">
                                <Select value={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </Select>
                            </FormField>
                        </div>
                        <FormField label="Upload Gambar">
                            <FileUpload
                                label="Pilih Gambar"
                                accept="image/*"
                                preview={
                                    formData.imagePreview
                                        ? formData.imagePreview
                                        : null
                                }
                                onChange={handleImageChange}
                            />
                        </FormField>
                    </div>
                </form>
            </Modal>

            <Modal
                open={isDetailModalOpen && !!selectedReward}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail Hadiah"
                subtitle="Informasi katalog lengkap"
                icon={Info}
                size="lg"
                footer={
                    <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                        Tutup
                    </Button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="w-full aspect-square bg-gray-100 rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
                        <img src={selectedReward?.image} className="w-full h-full object-cover" alt="Detail" onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=Reward&background=F3F4F6"; }} />
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 leading-tight">{selectedReward?.name}</h3>
                            <span className={`inline-block mt-2 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${selectedReward?.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{selectedReward?.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Poin</p>
                                <p className="text-xl font-black text-[#5A2EFF]">🪙 {selectedReward?.points_cost}</p>
                            </div>
                            <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Stok</p>
                                <p className="text-xl font-black text-gray-800">{selectedReward?.stock_qty} pcs</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Deskripsi</label>
                            <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">{selectedReward?.description}</p>
                        </div>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                open={isDeleteModalOpen && !!rewardToDelete}
                onClose={() => { setIsDeleteModalOpen(false); setRewardToDelete(null); }}
                onConfirm={handleDeleteReward}
                title="Hapus Hadiah?"
                description={`Anda akan menghapus hadiah "${rewardToDelete?.name}". Pengguna tidak akan dapat menukarkan poin dengan hadiah ini lagi.`}
                confirmLabel="Ya, Hapus"
                loading={isSubmitting}
            />

        </div>
    );
}
