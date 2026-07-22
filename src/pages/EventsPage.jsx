import { useState, useEffect } from 'react';
import {
    CalendarDays, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight,
    Image as ImageIcon, X, UploadCloud, CheckCircle2,
    Calendar, Clock, Info, ChevronDown, Flag
} from 'lucide-react';
import { getBaseUrl } from '../utils/apiConfig';

export default function EventsPage() {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // STATE MODAL
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);

    // FORM DATA
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        rules: '',
        color_theme: '#5A2EFF',
        start_at: '',
        end_at: '',
        published_at: '',
        status: 'active',
        banner_image: null,
        imagePreview: null
    });

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/events?page=${currentPage}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                setEvents(json.data.items || []);
                if (json.data.pagination) {
                    setTotalPages(json.data.pagination.totalPages);
                    setTotalItems(json.data.pagination.totalItems);
                }
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error("Gagal mengambil data event", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [currentPage]);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 4000);
    };

    // Helper untuk mengubah ISO Date dari Backend ke format input datetime-local HTML
    const formatDateTimeLocal = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const openAddModal = () => {
        setFormData({
            name: '', description: '', rules: '', color_theme: '#5A2EFF',
            start_at: '', end_at: '', published_at: '', status: 'active',
            banner_image: null, imagePreview: null
        });
        setIsAddModalOpen(true);
    };

    const openEditModal = (event) => {
        setSelectedEvent(event);
        setFormData({
            name: event.name,
            description: event.description || '',
            rules: event.rules || '',
            color_theme: event.color_theme || '#5A2EFF',
            start_at: formatDateTimeLocal(event.start_at),
            end_at: formatDateTimeLocal(event.end_at),
            published_at: formatDateTimeLocal(event.published_at),
            status: event.status || 'active',
            banner_image: null,
            imagePreview: event.banner_image_url
        });
        setIsEditModalOpen(true);
    };

    const openDetailModal = (event) => {
        setSelectedEvent(event);
        setIsDetailModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, banner_image: file, imagePreview: URL.createObjectURL(file) });
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
            data.append('color_theme', formData.color_theme);
            data.append('start_at', new Date(formData.start_at).toISOString());
            data.append('end_at', new Date(formData.end_at).toISOString());
            if (formData.description) data.append('description', formData.description);
            if (formData.rules) data.append('rules', formData.rules);
            if (formData.published_at) data.append('published_at', new Date(formData.published_at).toISOString());

            // Saat Add, otomatis active. Saat edit, ambil dari pilihan form.
            if (mode === 'add') {
                data.append('status', 'active');
            } else {
                data.append('status', formData.status);
            }

            if (formData.banner_image) data.append('banner_image', formData.banner_image);

            const url = mode === 'add'
                ? `${getBaseUrl()}/admin/events`
                : `${getBaseUrl()}/admin/events/${selectedEvent.id}`;

            const response = await fetch(url, {
                method: mode === 'add' ? 'POST' : 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            const json = await response.json();
            if (json.success || json.status === 'success') {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                fetchEvents();
                showToast(mode === 'add' ? 'Event berhasil ditambahkan!' : 'Event berhasil diperbarui!');
            } else {
                alert(json.message || "Terjadi kesalahan.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
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
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Events / Tantangan</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola event khusus untuk mendapatkan pencapaian lebih</p>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
                    <CalendarDays className="w-4 h-4 text-[#5A2EFF]" />
                    <span>Total: {totalItems} Event</span>
                </div>

                <button onClick={openAddModal} className="flex items-center px-4 py-2.5 bg-[#5A2EFF] text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition-colors">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Event
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100 font-bold text-gray-600 text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-center w-16">No.</th>
                                <th className="px-6 py-4 text-center w-32">Banner</th>
                                <th className="px-6 py-4">Nama Event</th>
                                <th className="px-6 py-4 text-center">Tema Warna</th>
                                <th className="px-6 py-4 text-center">Waktu Pelaksanaan</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Memuat data event...</td></tr>
                            ) : events.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Belum ada data event.</td></tr>
                            ) : (
                                events.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800 text-center">{((currentPage - 1) * 10) + index + 1}</td>
                                        <td className="px-6 py-4 flex justify-center">
                                            <div className="w-20 h-10 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                                                {item.banner_image_url ? (
                                                    <img
                                                        src={item.banner_image_url.startsWith('http') ? item.banner_image_url : `https://pltuapp.potydev.cloud/${item.banner_image_url}`}
                                                        alt={item.name} className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${item.name}&background=F3F4F6`; }}
                                                    />
                                                ) : <ImageIcon className="w-5 h-5 text-gray-400" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-extrabold text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className="px-3 py-1.5 rounded-lg font-mono font-bold text-white text-[10px] tracking-widest uppercase shadow-sm"
                                                style={{ backgroundColor: item.color_theme || '#9CA3AF' }}
                                            >
                                                {item.color_theme}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs font-medium text-gray-500">
                                            <div>{formatDate(item.start_at)}</div>
                                            <div className="my-0.5 text-gray-300">s/d</div>
                                            <div>{formatDate(item.end_at)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase ${item.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => openEditModal(item)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                                                <button className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => openDetailModal(item)} className="p-1.5 bg-indigo-50 text-[#5A2EFF] rounded-md hover:bg-indigo-100" title="Detail"><Eye className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing {events.length > 0 ? ((currentPage - 1) * 10) + 1 : 0}-
                        {Math.min(currentPage * 10, totalItems)} of {totalItems} results
                    </p>
                    <div className="flex space-x-1">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#5A2EFF] text-white font-bold text-sm">{currentPage}</button>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* ========================================= */}
            {/* MODAL FORM (REUSABLE TAMBAH & EDIT)       */}
            {/* ========================================= */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col my-auto border border-gray-100">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100"><CalendarDays className="w-5 h-5 text-[#5A2EFF]" /></div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-gray-900">{isAddModalOpen ? 'Tambah Event Baru' : 'Edit Event'}</h2>
                                    <p className="text-[11px] font-medium text-gray-500">Kelola informasi dan tantangan acara</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={(e) => handleSubmit(e, isAddModalOpen ? 'add' : 'edit')}>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">

                                {/* KOLOM KIRI: Data Input */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Nama Event</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Flag className="w-4 h-4 text-gray-400" /></div>
                                            <input type="text" required placeholder="Misal: Challenge Mei" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Deskripsi Event</label>
                                        <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] resize-none" placeholder="Penjelasan singkat event..." />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Aturan Event</label>
                                        <textarea rows="3" value={formData.rules} onChange={(e) => setFormData({ ...formData, rules: e.target.value })} className="w-full px-4 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] resize-none" placeholder="Aturan dan ketentuan event..." />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Waktu Pelaksanaan Mulai</label>
                                            <div className="relative">
                                                <input type="datetime-local" required value={formData.start_at} onChange={(e) => setFormData({ ...formData, start_at: e.target.value })} className="w-full px-4 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Waktu Pelaksanaan Selesai</label>
                                            <div className="relative">
                                                <input type="datetime-local" required value={formData.end_at} onChange={(e) => setFormData({ ...formData, end_at: e.target.value })} className="w-full px-4 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Tanggal Launching di App</label>
                                        <input type="datetime-local" required value={formData.published_at} onChange={(e) => setFormData({ ...formData, published_at: e.target.value })} className="w-full px-4 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Tema Warna Event</label>
                                            <div className="flex items-center space-x-2 bg-[#F8F9FC] border border-gray-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-[#5A2EFF]">
                                                <input type="color" value={formData.color_theme} onChange={(e) => setFormData({ ...formData, color_theme: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
                                                <input type="text" value={formData.color_theme.toUpperCase()} onChange={(e) => setFormData({ ...formData, color_theme: e.target.value })} className="w-full bg-transparent text-sm font-mono font-bold text-gray-700 outline-none uppercase pl-2" />
                                            </div>
                                        </div>

                                        {/* FIELD STATUS: HANYA MUNCUL SAAT EDIT */}
                                        {isEditModalOpen && (
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Status Event</label>
                                                <div className="relative">
                                                    <select
                                                        value={formData.status}
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                        className="w-full pl-4 pr-10 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                                    >
                                                        <option value="active">Active (Tampil ke User)</option>
                                                        <option value="archived">Archived (Selesai/Tutup)</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-gray-500" /></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* KOLOM KANAN: Upload Gambar Banner */}
                                <div className="flex flex-col">
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Banner Event</label>
                                    <div className="flex-1 bg-[#F8F9FC] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden group hover:border-[#5A2EFF] transition-colors min-h-[200px]">
                                        {formData.imagePreview ? (
                                            <>
                                                <img src={formData.imagePreview.startsWith('blob:') || formData.imagePreview.startsWith('http') ? formData.imagePreview : `https://pltuapp.potydev.cloud/${formData.imagePreview}`} className="w-full h-full object-cover absolute inset-0 z-0" alt="Preview Banner" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10">
                                                    <UploadCloud className="w-8 h-8 text-white mb-2" />
                                                    <span className="text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">Ganti Banner</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-center z-10">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-700 mb-1">Pilih Gambar Banner</p>
                                                <p className="text-[10px] text-gray-500 max-w-[200px]">Format: JPG, PNG. Rekomendasi rasio memanjang (Landscape).</p>
                                            </div>
                                        )}
                                        {/* Input required dihapus saat edit, karena gambar lama mungkin masih dipakai */}
                                        <input type="file" accept="image/*" onChange={handleImageChange} required={isAddModalOpen} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                                    </div>
                                </div>

                            </div>
                            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 rounded-b-3xl">
                                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-6 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-white transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-[#5A2EFF] text-white font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center">
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL DETAIL (VIEW ONLY)                  */}
            {/* ========================================= */}
            {isDetailModalOpen && selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col">

                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                                    <Info className="w-5 h-5 text-[#5A2EFF]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-gray-900">Detail Event</h2>
                                    <p className="text-[11px] font-medium text-gray-500">Informasi acara lengkap</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[70vh]">
                            {/* Banner Memanjang */}
                            <div className="w-full aspect-[21/9] bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative">
                                {selectedEvent.banner_image_url ? (
                                    <img
                                        src={selectedEvent.banner_image_url.startsWith('http') ? selectedEvent.banner_image_url : `https://pltuapp.potydev.cloud/${selectedEvent.banner_image_url}`}
                                        className="w-full h-full object-cover" alt="Banner"
                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=Event&background=F3F4F6"; }}
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-gray-400">Tidak ada banner</div>
                                )}
                                {/* Overlay warna tema */}
                                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: selectedEvent.color_theme || '#000' }}></div>
                            </div>

                            {/* Informasi Text */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-3xl font-black text-gray-900 leading-tight">{selectedEvent.name}</h3>
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase ${selectedEvent.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {selectedEvent.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                        <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Pelaksanaan Mulai
                                        </div>
                                        <p className="text-sm font-black text-gray-800">{formatDate(selectedEvent.start_at)}</p>
                                    </div>
                                    <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                        <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            <Clock className="w-3.5 h-3.5 mr-1.5" /> Pelaksanaan Selesai
                                        </div>
                                        <p className="text-sm font-black text-gray-800">{formatDate(selectedEvent.end_at)}</p>
                                    </div>
                                </div>

                                {selectedEvent.published_at && (
                                    <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                        <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Launching di App
                                        </div>
                                        <p className="text-sm font-black text-gray-800">{formatDate(selectedEvent.published_at)}</p>
                                    </div>
                                )}

                                {selectedEvent.description && (
                                    <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Deskripsi</p>
                                        <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                                    </div>
                                )}

                                {selectedEvent.rules && (
                                    <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Aturan</p>
                                        <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedEvent.rules}</p>
                                    </div>
                                )}

                                <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tema Warna Terpilih</span>
                                    <span
                                        className="px-4 py-1.5 rounded-md text-[10px] font-mono font-extrabold uppercase text-white shadow-sm"
                                        style={{ backgroundColor: selectedEvent.color_theme || '#9CA3AF' }}
                                    >
                                        {selectedEvent.color_theme || '#9CA3AF'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end">
                            <button onClick={() => setIsDetailModalOpen(false)} className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors shadow-sm">
                                Tutup Detail
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}