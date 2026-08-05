import { useState, useEffect } from 'react';
import {
    Award, Plus, Edit, Trash2, Star, Hash, ShieldCheck, Eye, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
    FormField, Input, Select, Button, Modal, Toast, PageHeader, ConfirmModal, FileUpload, CheckboxCard, SortableTh, PageSizeSelect
} from '../components/ui';
import { useTableSort } from '../hooks/useTableSort';
import { useClientPagination } from '../hooks/useClientPagination';
import { getBaseUrl } from '../utils/apiConfig';
import { isApiSuccess, getApiErrorMessage } from '../utils/apiFeedback';

export default function BadgesPage() {
    const [badges, setBadges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // STATE MODAL
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [selectedBadge, setSelectedBadge] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [badgeToDelete, setBadgeToDelete] = useState(null);

    // FORM DATA
    const [formData, setFormData] = useState({
        name: '',
        tier: '',
        min_xp: '',
        max_xp: '',
        color: '#5A2EFF',
        use_in_streak: false,
        image: null,
        imagePreview: null
    });

    const fetchBadges = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/badges`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                setBadges(json.data.items || []);
            } else {
                setBadges([]);
            }
        } catch (error) {
            console.error("Gagal mengambil data badge", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBadges();
    }, []);

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('success');
        }, 4000);
    };

    // HANDLER BUKA MODAL
    const openAddModal = () => {
        setFormData({
            name: '', tier: '', min_xp: '', max_xp: '', color: '#5A2EFF', use_in_streak: false, image: null, imagePreview: null
        });
        setIsAddModalOpen(true);
    };

    const openEditModal = (badge) => {
        setSelectedBadge(badge);
        setFormData({
            name: badge.name,
            tier: badge.tier,
            min_xp: badge.min_xp !== null ? badge.min_xp : '',
            max_xp: badge.max_xp !== null ? badge.max_xp : '',
            color: badge.color || '#5A2EFF',
            use_in_streak: badge.use_in_streak,
            image: null,
            imagePreview: badge.image_url
        });
        setIsEditModalOpen(true);
    };

    const openDetailModal = (badge) => {
        setSelectedBadge(badge);
        setIsDetailModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file, imagePreview: URL.createObjectURL(file) });
        }
    };

    // FUNGSI SUBMIT (POST & PUT)
    const handleSubmit = async (e, mode) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const data = new FormData();

            data.append('name', formData.name);
            data.append('tier', Number(formData.tier));

            if (formData.min_xp !== '') data.append('min_xp', Number(formData.min_xp));
            if (formData.max_xp !== '') data.append('max_xp', Number(formData.max_xp));

            data.append('color', formData.color);
            data.append('use_in_streak', formData.use_in_streak);
            if (formData.image) data.append('image', formData.image);

            const url = mode === 'add'
                ? `${getBaseUrl()}/admin/badges`
                : `${getBaseUrl()}/admin/badges/${selectedBadge.id}`;

            // KITA HAPUS TRIK _METHOD DI SINI
            // DAN LANGSUNG MENGGUNAKAN METHOD 'PUT' MURNI DI FETCH BAWAH

            const response = await fetch(url, {
                method: mode === 'add' ? 'POST' : 'PUT', // <-- Kembali menggunakan PUT untuk edit
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            const json = await response.json();
            if (isApiSuccess(json)) {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                fetchBadges();
                showToast(mode === 'add' ? 'Badge berhasil ditambahkan!' : 'Badge berhasil diperbarui!');
            } else {
                showToast(getApiErrorMessage(json, 'Terjadi kesalahan saat menyimpan badge.'), 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!badgeToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/badges/${badgeToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (isApiSuccess(json)) {
                setIsDeleteModalOpen(false);
                setBadgeToDelete(null);
                fetchBadges();
                showToast('Badge berhasil dihapus!');
            } else {
                setIsDeleteModalOpen(false);
                setBadgeToDelete(null);
                showToast(getApiErrorMessage(json, 'Gagal menghapus badge.'), 'error');
            }
        } catch (error) {
            setIsDeleteModalOpen(false);
            setBadgeToDelete(null);
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const { sortedItems: sortedBadges, sortKey, sortDir, requestSort } = useTableSort(badges, {
        initialKey: 'tier',
        initialDirection: 'asc',
    });
    const {
        page, setPage, pageSize, setPageSize, totalPages, totalItems, pageItems, from, to,
    } = useClientPagination(sortedBadges);

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

            <PageHeader
                title="Badges & Rank"
                subtitle="Kelola tingkatan status user berdasarkan pencapaian EXP"
                actions={
                    <Button icon={Plus} onClick={openAddModal}>
                        Tambah Badge
                    </Button>
                }
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
                    <Award className="w-4 h-4 text-[#5A2EFF]" />
                    <span>Total: {badges.length} Badges Aktif</span>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100 font-bold text-gray-600 text-[11px] uppercase tracking-wider">
                            <tr>
                                <SortableTh label="Tier" sortKey="tier" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px] w-16" />
                                <SortableTh label="Ikon" sortable={false} align="center" className="text-[11px] w-24" />
                                <SortableTh label="Nama Badge" sortKey="name" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="text-[11px]" />
                                <SortableTh label="Warna HEX" sortKey="color" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="Range EXP" sortKey="min_xp" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="Tampil di Streak" sortKey="use_in_streak" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="Actions" sortable={false} align="center" className="text-[11px]" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Memuat data badges...</td></tr>
                            ) : sortedBadges.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Belum ada data badge.</td></tr>
                            ) : (
                                pageItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-black text-gray-400 text-center text-lg">#{item.tier}</td>
                                        <td className="px-6 py-4 flex justify-center">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center p-1">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name} className="w-full h-full object-contain"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${item.name}&background=F3F4F6`; }}
                                                    />
                                                ) : <ShieldCheck className="w-6 h-6 text-gray-400" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className="px-3 py-1.5 rounded-lg font-extrabold text-white text-[10px] tracking-widest uppercase shadow-sm"
                                                style={{ backgroundColor: item.color || '#9CA3AF' }}
                                            >
                                                {item.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-gray-500 text-xs">
                                            {item.color}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700 text-center">
                                            <span className="text-orange-500">{item.min_xp !== null ? item.min_xp : '0'}</span>
                                            {' - '}
                                            <span className="text-orange-500">{item.max_xp !== null ? item.max_xp : '∞'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase ${item.use_in_streak ? 'bg-indigo-50 text-[#5A2EFF]' : 'bg-gray-100 text-gray-400'}`}>
                                                {item.use_in_streak ? 'YA' : 'TIDAK'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => openEditModal(item)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100" title="Edit">
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => { setBadgeToDelete(item); setIsDeleteModalOpen(true); }}
                                                    className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => openDetailModal(item)} className="p-1.5 bg-indigo-50 text-[#5A2EFF] rounded-md hover:bg-indigo-100" title="Detail">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <PageSizeSelect value={pageSize} onChange={setPageSize} />
                        <p className="text-sm text-gray-500 font-medium">
                            Showing {from}-{to} of {totalItems}
                        </p>
                    </div>
                    <div className="flex space-x-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#5A2EFF] text-white font-bold text-sm">{page}</button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <Modal
                open={isAddModalOpen || isEditModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                title={isAddModalOpen ? 'Tambah Badge' : 'Edit Badge'}
                subtitle="Sesuaikan status rank untuk user"
                icon={Award}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                            Batal
                        </Button>
                        <Button type="submit" form="badge-form" variant="primary" loading={isSubmitting}>
                            Simpan Badge
                        </Button>
                    </>
                }
            >
                <form id="badge-form" onSubmit={(e) => handleSubmit(e, isAddModalOpen ? 'add' : 'edit')} className="admin-form space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <FormField label="Nama Badge (Rank)" required>
                                <Input icon={ShieldCheck} type="text" required placeholder="Misal: BRONZE, PEMULA" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} inputClassName="uppercase" />
                            </FormField>
                            <FormField label="Tier (Urutan)" required>
                                <Input icon={Hash} type="number" required placeholder="Misal: 1" value={formData.tier} onChange={(e) => setFormData({ ...formData, tier: e.target.value })} />
                            </FormField>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Min EXP" hint="Kosongkan jika 0">
                                    <Input icon={Star} type="number" value={formData.min_xp} onChange={(e) => setFormData({ ...formData, min_xp: e.target.value })} />
                                </FormField>
                                <FormField label="Max EXP" hint="Kosongkan jika MAX">
                                    <Input icon={Star} type="number" value={formData.max_xp} onChange={(e) => setFormData({ ...formData, max_xp: e.target.value })} />
                                </FormField>
                            </div>
                            <FormField label="Warna Badge">
                                <div className="flex items-center space-x-2 bg-[#F8F9FC] border border-gray-200 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-[#5A2EFF]">
                                    <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
                                    <input type="text" value={formData.color.toUpperCase()} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full bg-transparent text-sm font-mono font-bold text-gray-700 outline-none uppercase" />
                                </div>
                            </FormField>
                            <CheckboxCard
                                checked={formData.use_in_streak}
                                onChange={(e) => setFormData({ ...formData, use_in_streak: e.target.checked })}
                                label="Use in Streak"
                                description="Tampilkan badge ini sebagai hadiah streak"
                            />
                        </div>
                        <FormField label="Ikon Badge" optional>
                            <FileUpload
                                label="Pilih Ikon"
                                hint="Disarankan format PNG transparan."
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

            {isDetailModalOpen && selectedBadge && (
                <Modal
                    open={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title="Detail Badge"
                    subtitle="Informasi lengkap tier dan rank"
                    icon={Info}
                    size="lg"
                    footer={
                        <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                            Tutup
                        </Button>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="w-full aspect-square bg-gray-100 rounded-3xl overflow-hidden border border-gray-100 shadow-inner flex items-center justify-center p-8 relative">
                            {selectedBadge.image_url ? (
                                <img
                                    src={selectedBadge.image_url}
                                    className="w-full h-full object-contain relative z-10 drop-shadow-md" alt="Detail"
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${selectedBadge.name}&background=F3F4F6`; }}
                                />
                            ) : (
                                <ShieldCheck className="w-24 h-24 text-gray-300" />
                            )}
                            <div className="absolute inset-0 opacity-20 blur-3xl rounded-full" style={{ backgroundColor: selectedBadge.color || '#9CA3AF' }}></div>
                        </div>

                        <div className="space-y-6 flex flex-col justify-center">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 leading-tight flex items-center gap-3">
                                    {selectedBadge.name}
                                    <span className="text-xl text-gray-400 font-bold">#{selectedBadge.tier}</span>
                                </h3>
                                <div className="flex items-center space-x-3 mt-3">
                                    <span
                                        className="px-3 py-1.5 rounded-lg font-extrabold text-white text-[10px] tracking-widest uppercase shadow-sm"
                                        style={{ backgroundColor: selectedBadge.color || '#9CA3AF' }}
                                    >
                                        Warna HEX: {selectedBadge.color}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Min EXP</p>
                                    <p className="text-2xl font-black text-orange-500">{selectedBadge.min_xp !== null ? selectedBadge.min_xp : '0'}</p>
                                </div>
                                <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Max EXP</p>
                                    <p className="text-2xl font-black text-orange-500">{selectedBadge.max_xp !== null ? selectedBadge.max_xp : '∞'}</p>
                                </div>
                            </div>

                            <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tampil di Streak?</span>
                                <span className={`px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${selectedBadge.use_in_streak ? 'bg-indigo-50 text-[#5A2EFF]' : 'bg-gray-200 text-gray-500'}`}>
                                    {selectedBadge.use_in_streak ? 'YA, DITAMPILKAN' : 'TIDAK'}
                                </span>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            <ConfirmModal
                open={isDeleteModalOpen && !!badgeToDelete}
                onClose={() => { setIsDeleteModalOpen(false); setBadgeToDelete(null); }}
                onConfirm={executeDelete}
                title="Hapus Badge?"
                description={`Anda akan menghapus badge "${badgeToDelete?.name}". Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Ya, Hapus"
                loading={isSubmitting}
            />

        </div>
    );
}