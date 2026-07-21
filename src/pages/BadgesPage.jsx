import { useState, useEffect } from 'react';
import {
    Award, Plus, Edit, Trash2, ChevronLeft, ChevronRight,
    ImageIcon, X, Star, Hash, UploadCloud, CheckCircle2,
    ShieldCheck, Eye, Info, AlertTriangle
} from 'lucide-react';
import { getBaseUrl } from '../utils/apiConfig';

export default function BadgesPage() {
    const [badges, setBadges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // STATE MODAL
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
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

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 4000);
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
            if (json.success || json.status === 'success') {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                fetchBadges();
                showToast(mode === 'add' ? 'Badge berhasil ditambahkan!' : 'Badge berhasil diperbarui!');
            } else {
                alert(json.message || "Terjadi kesalahan: " + (json.error?.message || ""));
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
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

            if (json.success || json.status === 'success') {
                setIsDeleteModalOpen(false);
                setBadgeToDelete(null);
                fetchBadges();
                showToast('Badge berhasil dihapus!');
            } else {
                alert(json.message || json.error?.message || 'Gagal menghapus badge.');
            }
        } catch (error) {
            alert('Terjadi kesalahan jaringan.');
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
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Badges & Rank</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola tingkatan status user berdasarkan pencapaian EXP</p>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
                    <Award className="w-4 h-4 text-[#5A2EFF]" />
                    <span>Total: {badges.length} Badges Aktif</span>
                </div>

                <button onClick={openAddModal} className="flex items-center px-4 py-2.5 bg-[#5A2EFF] text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition-colors">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Badge
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100 font-bold text-gray-600 text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-center w-16">Tier</th>
                                <th className="px-6 py-4 text-center w-24">Ikon</th>
                                <th className="px-6 py-4">Nama Badge</th>
                                <th className="px-6 py-4 text-center">Warna HEX</th>
                                <th className="px-6 py-4 text-center">Range EXP</th>
                                <th className="px-6 py-4 text-center">Tampil di Streak</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Memuat data badges...</td></tr>
                            ) : badges.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Belum ada data badge.</td></tr>
                            ) : (
                                badges.sort((a, b) => a.tier - b.tier).map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-black text-gray-400 text-center text-lg">#{item.tier}</td>
                                        <td className="px-6 py-4 flex justify-center">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center p-1">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url.startsWith('http') ? item.image_url : `https://pltuapp.potydev.cloud/${item.image_url}`}
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
            </div>

            {/* ========================================= */}
            {/* MODAL FORM (REUSABLE TAMBAH & EDIT)       */}
            {/* ========================================= */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col my-auto border border-gray-100">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100"><Award className="w-5 h-5 text-[#5A2EFF]" /></div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-gray-900">{isAddModalOpen ? 'Tambah Badge' : 'Edit Badge'}</h2>
                                    <p className="text-[11px] font-medium text-gray-500">Sesuaikan status rank untuk user</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={(e) => handleSubmit(e, isAddModalOpen ? 'add' : 'edit')}>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">

                                {/* KOLOM KIRI: Data Input */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Nama Badge (Rank)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><ShieldCheck className="w-4 h-4 text-gray-400" /></div>
                                            <input type="text" required placeholder="Misal: BRONZE, PEMULA" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all uppercase" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Tier (Urutan)</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Hash className="w-4 h-4 text-gray-400" /></div>
                                                <input type="number" required placeholder="Misal: 1" value={formData.tier} onChange={(e) => setFormData({ ...formData, tier: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" />
                                            </div>
                                        </div>

                                        {/* Range EXP */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Min EXP</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Star className="w-4 h-4 text-gray-400" /></div>
                                                <input type="number" placeholder="Kosongkan jika 0" value={formData.min_xp} onChange={(e) => setFormData({ ...formData, min_xp: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Max EXP</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Star className="w-4 h-4 text-gray-400" /></div>
                                                <input type="number" placeholder="Kosongkan jika MAX" value={formData.max_xp} onChange={(e) => setFormData({ ...formData, max_xp: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Color Picker HTML5 */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Warna Badge</label>
                                            <div className="flex items-center space-x-2 bg-[#F8F9FC] border border-gray-200 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-[#5A2EFF]">
                                                <input
                                                    type="color"
                                                    value={formData.color}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.color.toUpperCase()}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                    className="w-full bg-transparent text-sm font-mono font-bold text-gray-700 outline-none uppercase"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Use in Streak?</label>
                                            <div className="relative h-[44px] flex items-center bg-[#F8F9FC] border border-gray-200 rounded-xl px-4">
                                                <label className="flex items-center cursor-pointer space-x-3 w-full">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.use_in_streak}
                                                        onChange={(e) => setFormData({ ...formData, use_in_streak: e.target.checked })}
                                                        className="w-5 h-5 rounded text-[#5A2EFF] focus:ring-[#5A2EFF] border-gray-300"
                                                    />
                                                    <span className="text-sm font-bold text-gray-700">Ya, gunakan</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* KOLOM KANAN: Upload Gambar */}
                                <div className="flex flex-col">
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Ikon Badge (Opsional)</label>
                                    <div className="flex-1 bg-[#F8F9FC] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden group hover:border-[#5A2EFF] transition-colors">
                                        {formData.imagePreview ? (
                                            <>
                                                <img src={formData.imagePreview.startsWith('blob:') || formData.imagePreview.startsWith('http') ? formData.imagePreview : `https://pltuapp.potydev.cloud/${formData.imagePreview}`} className="w-1/2 h-1/2 object-contain absolute inset-0 m-auto z-0" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10"><UploadCloud className="w-8 h-8 text-white mb-2" /><span className="text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">Ganti Ikon</span></div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-center z-10"><div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100"><ShieldCheck className="w-8 h-8 text-gray-400" /></div><p className="text-sm font-bold text-gray-700 mb-1">Pilih Ikon</p><p className="text-[10px] text-gray-500 max-w-[200px]">Disarankan format PNG transparan.</p></div>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                                    </div>
                                </div>
                            </div>
                            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-6 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-white transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-[#5A2EFF] text-white font-bold shadow-sm hover:bg-indigo-700 transition-colors">{isSubmitting ? 'Proses...' : 'Simpan Badge'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL DETAIL (VIEW ONLY)                  */}
            {/* ========================================= */}
            {isDetailModalOpen && selectedBadge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                                    <Info className="w-5 h-5 text-[#5A2EFF]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-gray-900">Detail Badge</h2>
                                    <p className="text-[11px] font-medium text-gray-500">Informasi lengkap tier dan rank</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">

                            {/* Kolom Kiri: Ikon */}
                            <div className="w-full aspect-square bg-gray-100 rounded-3xl overflow-hidden border border-gray-100 shadow-inner flex items-center justify-center p-8 relative">
                                {selectedBadge.image_url ? (
                                    <img
                                        src={selectedBadge.image_url?.startsWith('http') ? selectedBadge.image_url : `https://pltuapp.potydev.cloud/${selectedBadge.image_url}`}
                                        className="w-full h-full object-contain relative z-10 drop-shadow-md" alt="Detail"
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${selectedBadge.name}&background=F3F4F6`; }}
                                    />
                                ) : (
                                    <ShieldCheck className="w-24 h-24 text-gray-300" />
                                )}
                                {/* Efek glow berdasarkan warna background */}
                                <div className="absolute inset-0 opacity-20 blur-3xl rounded-full" style={{ backgroundColor: selectedBadge.color || '#9CA3AF' }}></div>
                            </div>

                            {/* Kolom Kanan: Informasi */}
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

                        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end">
                            <button onClick={() => setIsDetailModalOpen(false)} className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors shadow-sm">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL HAPUS */}
            {isDeleteModalOpen && badgeToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Hapus Badge?</h3>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Anda akan menghapus badge <strong className="text-gray-700">"{badgeToDelete.name}"</strong>. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => { setIsDeleteModalOpen(false); setBadgeToDelete(null); }}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeDelete}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}