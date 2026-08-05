import { useState, useEffect } from 'react';
import {
    CalendarDays, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight,
    Image as ImageIcon, Calendar, Clock, Info, Flag, Gift
} from 'lucide-react';
import {
    FormField, Input, Select, Textarea, Button, Modal, Toast, PageHeader, FileUpload, ConfirmModal, SortableTh, PageSizeSelect
} from '../components/ui';
import { useTableSort } from '../hooks/useTableSort';
import { DEFAULT_TABLE_PAGE_SIZE } from '../constants/tablePagination';
import { getBaseUrl } from '../utils/apiConfig';
import { isApiSuccess, getApiErrorMessage } from '../utils/apiFeedback';

export default function EventsPage() {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // STATE MODAL
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isGrantConfirmOpen, setIsGrantConfirmOpen] = useState(false);
    const [isGrantingPoints, setIsGrantingPoints] = useState(false);
    const [grantSummary, setGrantSummary] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [allActivityTypes, setAllActivityTypes] = useState([]);

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
        awards_points: false,
        banner_image: null,
        imagePreview: null,
        allowed_activities: [],
    });

    const fetchActivityTypes = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/activity-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) setAllActivityTypes(json.data || []);
        } catch (error) {
            console.error('Gagal mengambil tipe aktivitas', error);
        }
    };

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/events?page=${currentPage}&limit=${pageSize}`, {
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
        fetchActivityTypes();
    }, [currentPage, pageSize]);

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('success');
        }, 4000);
    };

    const openGrantConfirm = () => {
        setIsDetailModalOpen(false);
        setIsGrantConfirmOpen(true);
    };

    // Helper untuk mengubah ISO Date dari Backend ke format input datetime-local HTML
    const formatDateTimeLocal = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const emptyAllowedActivity = () => ({
        activity_type_id: '',
        min_distance_km: '',
        min_duration_minutes: '',
        min_calories: '',
        max_submissions_per_day: '',
        max_submissions_total: '',
    });

    const addAllowedActivity = () => {
        setFormData((prev) => ({
            ...prev,
            allowed_activities: [...prev.allowed_activities, emptyAllowedActivity()],
        }));
    };

    const updateAllowedActivity = (index, field, value) => {
        setFormData((prev) => {
            const next = [...prev.allowed_activities];
            next[index] = { ...next[index], [field]: value };
            return { ...prev, allowed_activities: next };
        });
    };

    const removeAllowedActivity = (index) => {
        setFormData((prev) => ({
            ...prev,
            allowed_activities: prev.allowed_activities.filter((_, i) => i !== index),
        }));
    };

    const openAddModal = () => {
        setFormData({
            name: '', description: '', rules: '', color_theme: '#5A2EFF',
            start_at: '', end_at: '', published_at: '', status: 'active',
            awards_points: false,
            banner_image: null, imagePreview: null,
            allowed_activities: [],
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
            awards_points: Boolean(event.awards_points),
            banner_image: null,
            imagePreview: event.banner_image_url,
            allowed_activities: (event.allowed_activities || []).map((item) => ({
                activity_type_id: String(item.activity_type_id),
                min_distance_km: item.min_distance_km ?? '',
                min_duration_minutes: item.min_duration_minutes ?? '',
                min_calories: item.min_calories ?? '',
                max_submissions_per_day: item.max_submissions_per_day ?? '',
                max_submissions_total: item.max_submissions_total ?? '',
            })),
        });
        setIsEditModalOpen(true);
    };

    const openDetailModal = (event) => {
        setSelectedEvent(event);
        setGrantSummary(null);
        setIsDetailModalOpen(true);
    };

    const handleGrantPoints = async () => {
        if (!selectedEvent) return;
        setIsGrantingPoints(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/events/${selectedEvent.id}/grant-points`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const json = await response.json();
            if (isApiSuccess(json)) {
                const summary = json.data;
                setGrantSummary(summary);
                setSelectedEvent((prev) => (prev ? { ...prev, awards_points: true } : prev));
                fetchEvents();
                showToast(
                    `Grant selesai: ${summary.awarded} submission mendapat total ${summary.total_points} poin (diproses: ${summary.processed}).`,
                    'success'
                );
            } else {
                showToast(getApiErrorMessage(json, 'Gagal grant poin event.'), 'error');
            }
        } catch {
            showToast('Terjadi kesalahan jaringan saat grant poin.', 'error');
        } finally {
            setIsGrantingPoints(false);
            setIsGrantConfirmOpen(false);
        }
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

            data.append('awards_points', formData.awards_points ? 'true' : 'false');

            if (formData.banner_image) data.append('banner_image', formData.banner_image);

            const allowedPayload = formData.allowed_activities
                .filter((item) => item.activity_type_id)
                .map((item) => ({
                    activity_type_id: Number(item.activity_type_id),
                    ...(item.min_distance_km !== '' ? { min_distance_km: Number(item.min_distance_km) } : {}),
                    ...(item.min_duration_minutes !== '' ? { min_duration_minutes: Number(item.min_duration_minutes) } : {}),
                    ...(item.min_calories !== '' ? { min_calories: Number(item.min_calories) } : {}),
                    ...(item.max_submissions_per_day !== '' ? { max_submissions_per_day: Number(item.max_submissions_per_day) } : {}),
                    ...(item.max_submissions_total !== '' ? { max_submissions_total: Number(item.max_submissions_total) } : {}),
                }));

            data.append('allowed_activities', JSON.stringify(allowedPayload));

            const url = mode === 'add'
                ? `${getBaseUrl()}/admin/events`
                : `${getBaseUrl()}/admin/events/${selectedEvent.id}`;

            const response = await fetch(url, {
                method: mode === 'add' ? 'POST' : 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            const json = await response.json();
            if (isApiSuccess(json)) {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                fetchEvents();
                showToast(mode === 'add' ? 'Event berhasil ditambahkan!' : 'Event berhasil diperbarui!');
            } else {
                showToast(getApiErrorMessage(json, 'Terjadi kesalahan.'), 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const { sortedItems: sortedEvents, sortKey, sortDir, requestSort } = useTableSort(events);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
    };

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

            <PageHeader
                title="Events / Tantangan"
                subtitle="Kelola event khusus untuk mendapatkan pencapaian lebih"
                actions={
                    <Button icon={Plus} onClick={openAddModal}>
                        Tambah Event
                    </Button>
                }
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
                    <CalendarDays className="w-4 h-4 text-[#5A2EFF]" />
                    <span>Total: {totalItems} Event</span>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100 font-bold text-gray-600 text-[11px] uppercase tracking-wider">
                            <tr>
                                <SortableTh label="No." sortable={false} align="center" className="text-[11px] w-16" />
                                <SortableTh label="Banner" sortable={false} align="center" className="text-[11px] w-32" />
                                <SortableTh label="Nama Event" sortKey="name" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="text-[11px]" />
                                <SortableTh label="Tema Warna" sortKey="color_theme" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="Waktu Pelaksanaan" sortKey="start_at" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="Status" sortKey="status" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="Actions" sortable={false} align="center" className="text-[11px] w-32" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Memuat data event...</td></tr>
                            ) : sortedEvents.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Belum ada data event.</td></tr>
                            ) : (
                                sortedEvents.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800 text-center">{((currentPage - 1) * pageSize) + index + 1}</td>
                                        <td className="px-6 py-4 flex justify-center">
                                            <div className="w-20 h-10 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                                                {item.banner_image_url ? (
                                                    <img
                                                        src={item.banner_image_url}
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
                <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <PageSizeSelect value={pageSize} onChange={handlePageSizeChange} />
                        <p className="text-sm text-gray-500 font-medium">
                            Showing {events.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0}-
                            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
                        </p>
                    </div>
                    <div className="flex space-x-1">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                        {(function () {
                            const pages = [];
                            const maxVisible = 5;
                            let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                            const end = Math.min(totalPages, start + maxVisible - 1);
                            if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
                            for (let i = start; i <= end; i++) pages.push(i);
                            return pages.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold transition-colors ${page === currentPage ? 'bg-[#5A2EFF] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {page}
                                </button>
                            ));
                        })()}
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <Modal
                open={isAddModalOpen || isEditModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                title={isAddModalOpen ? 'Tambah Event Baru' : 'Edit Event'}
                subtitle="Kelola informasi dan tantangan acara"
                icon={CalendarDays}
                size="full"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="event-form"
                            variant="primary"
                            loading={isSubmitting}
                        >
                            Simpan Event
                        </Button>
                    </>
                }
            >
                <form
                    id="event-form"
                    onSubmit={(e) => handleSubmit(e, isAddModalOpen ? 'add' : 'edit')}
                    className="admin-form space-y-8"
                >
                    {/* ── Informasi Dasar ── */}
                    <section className="space-y-4">
                        <div className="border-b border-gray-100 pb-2">
                            <h3 className="text-sm font-extrabold text-gray-900">Informasi Dasar</h3>
                            <p className="mt-0.5 text-xs text-gray-500">Nama, deskripsi, dan aturan event</p>
                        </div>

                        <FormField label="Nama Event" required>
                            <Input
                                icon={Flag}
                                type="text"
                                required
                                placeholder="Misal: PLTU Run Challenge Mei 2026"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </FormField>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <FormField label="Deskripsi Event" optional hint="Tampil di halaman detail event">
                                <Textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Penjelasan singkat tentang event..."
                                />
                            </FormField>
                            <FormField label="Aturan Event" optional hint="Syarat umum partisipasi">
                                <Textarea
                                    rows={4}
                                    value={formData.rules}
                                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                                    placeholder="Aturan dan ketentuan event..."
                                />
                            </FormField>
                        </div>
                    </section>

                    {/* ── Jadwal ── */}
                    <section className="space-y-4">
                        <div className="border-b border-gray-100 pb-2">
                            <h3 className="text-sm font-extrabold text-gray-900">Jadwal Event</h3>
                            <p className="mt-0.5 text-xs text-gray-500">Periode pelaksanaan dan waktu publikasi di aplikasi</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <FormField label="Waktu Mulai" required>
                                <Input
                                    icon={Calendar}
                                    type="datetime-local"
                                    required
                                    value={formData.start_at}
                                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Waktu Selesai" required>
                                <Input
                                    icon={Clock}
                                    type="datetime-local"
                                    required
                                    value={formData.end_at}
                                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Launching di App" required hint="Kapan event tampil ke user">
                                <Input
                                    icon={CalendarDays}
                                    type="datetime-local"
                                    required
                                    value={formData.published_at}
                                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                                />
                            </FormField>
                        </div>
                    </section>

                    {/* ── Tampilan ── */}
                    <section className="space-y-4">
                        <div className="border-b border-gray-100 pb-2">
                            <h3 className="text-sm font-extrabold text-gray-900">Tampilan & Banner</h3>
                            <p className="mt-0.5 text-xs text-gray-500">Visual event di aplikasi mobile</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <FormField
                                label="Banner Event"
                                optional={!isAddModalOpen}
                                required={isAddModalOpen}
                                hint="JPG/PNG, rasio landscape (mis. 16:9)"
                                className="lg:col-span-2"
                            >
                                <FileUpload
                                    label="Klik untuk upload banner"
                                    hint="Rekomendasi min. 1200×675 px"
                                    accept="image/*"
                                    required={isAddModalOpen}
                                    preview={
                                        formData.imagePreview
                                            ? formData.imagePreview
                                            : null
                                    }
                                    onChange={handleImageChange}
                                    className="min-h-[180px]"
                                />
                            </FormField>

                            <div className="space-y-4">
                                <FormField label="Tema Warna" hint="Warna aksen di aplikasi">
                                    <div className="flex h-10 items-center gap-2 rounded-xl border border-input bg-background px-2 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                                        <input
                                            type="color"
                                            value={formData.color_theme}
                                            onChange={(e) => setFormData({ ...formData, color_theme: e.target.value })}
                                            className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                                            aria-label="Pilih warna tema"
                                        />
                                        <input
                                            type="text"
                                            value={formData.color_theme.toUpperCase()}
                                            onChange={(e) => setFormData({ ...formData, color_theme: e.target.value })}
                                            placeholder="#5A2EFF"
                                            className="min-w-0 flex-1 bg-transparent text-sm font-mono font-bold uppercase text-gray-700 outline-none"
                                            aria-label="Kode warna hex"
                                        />
                                    </div>
                                </FormField>

                                {isEditModalOpen && (
                                    <FormField label="Status Event">
                                        <Select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="active">Active — Tampil ke user</option>
                                            <option value="archived">Archived — Event selesai</option>
                                        </Select>
                                    </FormField>
                                )}

                                <FormField
                                    label="Poin Event"
                                    hint="Jika aktif, submission event yang di-approve mendapat poin seperti aktivitas tahunan (ikut batas harian)."
                                >
                                    <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-[#F8F9FC] px-4 py-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#5A2EFF] focus:ring-[#5A2EFF]"
                                            checked={formData.awards_points}
                                            onChange={(e) => setFormData({ ...formData, awards_points: e.target.checked })}
                                        />
                                        <span>
                                            <span className="block text-sm font-bold text-gray-800">Submission event dapat poin</span>
                                            <span className="mt-0.5 block text-xs text-gray-500">XP tetap dihitung terpisah seperti sebelumnya.</span>
                                        </span>
                                    </label>
                                </FormField>
                            </div>
                        </div>
                    </section>

                    {/* ── Aktivitas Diizinkan ── */}
                    <section className="space-y-4">
                        <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-extrabold text-gray-900">Aktivitas Diizinkan</h3>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Kosong = semua tipe aktivitas diizinkan tanpa restriksi khusus
                                </p>
                            </div>
                            <Button type="button" variant="secondary" size="sm" onClick={addAllowedActivity}>
                                + Tambah Aktivitas
                            </Button>
                        </div>

                        {formData.allowed_activities.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-[#F8F9FC] px-4 py-8 text-center">
                                <p className="text-sm font-medium text-gray-500">Belum ada restriksi aktivitas</p>
                                <p className="mt-1 text-xs text-gray-400">Semua jenis aktivitas dapat disubmit selama event berlangsung</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.allowed_activities.map((item, index) => (
                                    <div key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                        <div className="flex items-center justify-between border-b border-gray-100 bg-[#F8F9FC] px-4 py-2.5">
                                            <span className="text-xs font-extrabold uppercase tracking-wide text-gray-600">
                                                Aktivitas #{index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeAllowedActivity(index)}
                                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Hapus
                                            </button>
                                        </div>

                                        <div className="space-y-4 p-4">
                                            <FormField label="Tipe Aktivitas" required>
                                                <Select
                                                    value={item.activity_type_id}
                                                    onChange={(e) => updateAllowedActivity(index, 'activity_type_id', e.target.value)}
                                                >
                                                    <option value="" disabled>Pilih tipe aktivitas</option>
                                                    {allActivityTypes.map((type) => (
                                                        <option key={type.id} value={type.id}>{type.name}</option>
                                                    ))}
                                                </Select>
                                            </FormField>

                                            <div className="space-y-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Syarat Minimum</p>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                    <FormField label="Min. Jarak (km)" optional>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="0"
                                                            value={item.min_distance_km}
                                                            onChange={(e) => updateAllowedActivity(index, 'min_distance_km', e.target.value)}
                                                        />
                                                    </FormField>
                                                    <FormField label="Min. Durasi (menit)" optional>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={item.min_duration_minutes}
                                                            onChange={(e) => updateAllowedActivity(index, 'min_duration_minutes', e.target.value)}
                                                        />
                                                    </FormField>
                                                    <FormField label="Min. Kalori (kcal)" optional>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={item.min_calories}
                                                            onChange={(e) => updateAllowedActivity(index, 'min_calories', e.target.value)}
                                                        />
                                                    </FormField>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Batas Submit</p>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <FormField label="Maks. per Hari" optional hint="Kosong = tidak dibatasi">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="Tidak dibatasi"
                                                            value={item.max_submissions_per_day}
                                                            onChange={(e) => updateAllowedActivity(index, 'max_submissions_per_day', e.target.value)}
                                                        />
                                                    </FormField>
                                                    <FormField label="Maks. Total Event" optional hint="Kosong = tidak dibatasi">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="Tidak dibatasi"
                                                            value={item.max_submissions_total}
                                                            onChange={(e) => updateAllowedActivity(index, 'max_submissions_total', e.target.value)}
                                                        />
                                                    </FormField>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </form>
            </Modal>

            <ConfirmModal
                open={isGrantConfirmOpen}
                onClose={() => !isGrantingPoints && setIsGrantConfirmOpen(false)}
                onConfirm={handleGrantPoints}
                title="Grant Poin ke Submission Approved?"
                description={`Poin akan diberikan ke submission APPROVED pada event "${selectedEvent?.name}" yang belum punya poin. Mengikuti batas harian. XP tidak diubah. Aksi ini aman dijalankan ulang.`}
                confirmLabel="Ya, Grant Poin"
                loading={isGrantingPoints}
                variant="primary"
            />

            <Modal
                open={isDetailModalOpen && !!selectedEvent}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail Event"
                subtitle="Informasi acara lengkap"
                icon={Info}
                size="lg"
                footer={
                    <>
                        <Button
                            variant="primary"
                            icon={Gift}
                            onClick={openGrantConfirm}
                            disabled={isGrantingPoints}
                        >
                            Grant poin ke submission approved
                        </Button>
                        <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                            Tutup Detail
                        </Button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div className="w-full aspect-[21/9] bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative">
                        {selectedEvent?.banner_image_url ? (
                            <img
                                src={selectedEvent.banner_image_url}
                                className="w-full h-full object-cover" alt="Banner"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=Event&background=F3F4F6"; }}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">Tidak ada banner</div>
                        )}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundColor: selectedEvent?.color_theme || '#000' }}></div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black text-gray-900 leading-tight">{selectedEvent?.name}</h3>
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase ${selectedEvent?.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {selectedEvent?.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    <Calendar className="w-3.5 h-3.5 mr-1.5" /> Pelaksanaan Mulai
                                </div>
                                <p className="text-sm font-black text-gray-800">{formatDate(selectedEvent?.start_at)}</p>
                            </div>
                            <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Pelaksanaan Selesai
                                </div>
                                <p className="text-sm font-black text-gray-800">{formatDate(selectedEvent?.end_at)}</p>
                            </div>
                        </div>

                        {selectedEvent?.published_at && (
                            <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Launching di App
                                </div>
                                <p className="text-sm font-black text-gray-800">{formatDate(selectedEvent.published_at)}</p>
                            </div>
                        )}

                        {selectedEvent?.description && (
                            <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Deskripsi</p>
                                <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                            </div>
                        )}

                        {selectedEvent?.rules && (
                            <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Aturan</p>
                                <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedEvent.rules}</p>
                            </div>
                        )}

                        <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tema Warna Terpilih</span>
                            <span
                                className="px-4 py-1.5 rounded-md text-[10px] font-mono font-extrabold uppercase text-white shadow-sm"
                                style={{ backgroundColor: selectedEvent?.color_theme || '#9CA3AF' }}
                            >
                                {selectedEvent?.color_theme || '#9CA3AF'}
                            </span>
                        </div>

                        <div className="bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Submission Dapat Poin</span>
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase ${selectedEvent?.awards_points ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {selectedEvent?.awards_points ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </div>

                        {grantSummary && (
                            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#5A2EFF]">Hasil Grant Poin</p>
                                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-700">
                                    <p>Diproses: <span className="font-bold">{grantSummary.processed}</span></p>
                                    <p>Dapat poin: <span className="font-bold">{grantSummary.awarded}</span></p>
                                    <p>Total poin: <span className="font-bold">{grantSummary.total_points}</span></p>
                                    <p>Sudah punya poin: <span className="font-bold">{grantSummary.skipped_already_has_points}</span></p>
                                    <p>Kena batas harian: <span className="font-bold">{grantSummary.skipped_daily_cap}</span></p>
                                    <p>Tanpa rule/ambang: <span className="font-bold">{grantSummary.skipped_no_rule}</span></p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

        </div>
    );
}