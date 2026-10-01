import { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Activity, Watch, Smartphone, Footprints, Bike, HeartPulse, Timer, PenLine, Lock, RotateCcw
} from 'lucide-react';
import {
    FormField, Input, Select, Button, Modal, SearchBar, Toast, PageHeader, ConfirmModal, CheckboxCard
} from '../components/ui';
import { getBaseUrl } from '../utils/apiConfig';
import { isApiSuccess, getApiErrorMessage } from '../utils/apiFeedback';

// Harus sama persis dengan katalog ikon di backend (recorded-via.catalog.ts).
const ICON_OPTIONS = [
    { key: 'strava', label: 'Strava', Icon: Activity },
    { key: 'watch', label: 'Jam Tangan', Icon: Watch },
    { key: 'smartphone', label: 'Ponsel', Icon: Smartphone },
    { key: 'footprints', label: 'Langkah Kaki', Icon: Footprints },
    { key: 'bike', label: 'Sepeda', Icon: Bike },
    { key: 'heart-pulse', label: 'Detak Jantung', Icon: HeartPulse },
    { key: 'timer', label: 'Timer', Icon: Timer },
    { key: 'pen', label: 'Catatan Manual', Icon: PenLine },
];

const ICON_BY_KEY = Object.fromEntries(ICON_OPTIONS.map((option) => [option.key, option.Icon]));

const EMPTY_FORM = {
    label: '',
    code: '',
    icon: 'pen',
    requires_source_link: false,
    sort_order: '',
    is_active: true,
};

export default function RecordedViaPage() {
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedId, setSelectedId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [optionToDelete, setOptionToDelete] = useState(null);

    const [formData, setFormData] = useState(EMPTY_FORM);

    const isLockedSelected = modalMode === 'edit' && options.find((item) => item.id === selectedId)?.is_locked === true;
    const SelectedIcon = ICON_BY_KEY[formData.icon] ?? PenLine;

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('success');
        }, 3000);
    };

    const fetchOptions = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/recorded-via-options`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (isApiSuccess(json)) setOptions(json.data ?? []);
        } catch (error) {
            console.error('Gagal mengambil data "Dicatat Dengan"', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedId(null);
        setFormData(EMPTY_FORM);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
        setSelectedId(item.id);
        setFormData({
            label: item.label,
            code: item.code,
            icon: item.icon,
            requires_source_link: item.requires_source_link,
            sort_order: String(item.sort_order),
            is_active: item.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const isAdd = modalMode === 'add';
            const url = isAdd
                ? `${getBaseUrl()}/admin/recorded-via-options`
                : `${getBaseUrl()}/admin/recorded-via-options/${selectedId}`;

            // Opsi terkunci (Strava): kode, aturan link, dan status aktif tidak boleh dikirim.
            const { sort_order } = formData;
            const parsedSortOrder = sort_order === '' ? undefined : Number(sort_order);
            const payload = {
                label: formData.label,
                icon: formData.icon,
                ...(parsedSortOrder !== undefined ? { sort_order: parsedSortOrder } : {}),
                ...(isLockedSelected ? {} : {
                    code: formData.code.trim() === '' ? undefined : formData.code.trim(),
                    requires_source_link: formData.requires_source_link,
                    is_active: formData.is_active,
                }),
            };

            const response = await fetch(url, {
                method: isAdd ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const json = await response.json();
            if (isApiSuccess(json)) {
                closeModal();
                fetchOptions();
                showToast(isAdd ? 'Opsi berhasil ditambahkan!' : 'Opsi berhasil diperbarui!');
            } else {
                showToast(getApiErrorMessage(json, 'Gagal memproses data.'), 'error');
            }
        } catch (error) {
            showToast('Gagal memproses data.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleActive = async (item, isActive) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/recorded-via-options/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ is_active: isActive })
            });
            const json = await response.json();
            if (isApiSuccess(json)) {
                fetchOptions();
                showToast(isActive ? 'Opsi diaktifkan kembali!' : 'Opsi dinonaktifkan!');
            } else {
                showToast(getApiErrorMessage(json, 'Gagal mengubah status.'), 'error');
            }
        } catch (error) {
            showToast('Gagal mengubah status.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!optionToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/recorded-via-options/${optionToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (isApiSuccess(json)) {
                fetchOptions();
                showToast('Opsi dihapus. Riwayat aktivitas lama tetap aman.');
            } else {
                showToast(getApiErrorMessage(json, 'Gagal menghapus data.'), 'error');
            }
        } catch (error) {
            showToast('Gagal menghapus data.', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setOptionToDelete(null);
            setIsSubmitting(false);
        }
    };

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

            <PageHeader
                title="Dicatat Dengan"
                subtitle="Kelola opsi metode pencatatan aktivitas yang bisa dipilih pengguna"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SearchBar
                    label="Cari Opsi"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari opsi"
                    className="w-full sm:max-w-xs"
                />
                <Button icon={Plus} onClick={() => { setModalMode('add'); setFormData(EMPTY_FORM); setIsModalOpen(true); }}>
                    Tambah Opsi
                </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 font-bold text-gray-600 text-xs w-16 text-center">No</th>
                                <th className="px-6 py-3 font-bold text-gray-600 text-xs">Nama</th>
                                <th className="px-6 py-3 font-bold text-gray-600 text-xs w-40">Kode</th>
                                <th className="px-6 py-3 font-bold text-gray-600 text-xs w-24 text-center">Urutan</th>
                                <th className="px-6 py-3 font-bold text-gray-600 text-xs w-32 text-center">Wajib Link</th>
                                <th className="px-6 py-3 font-bold text-gray-600 text-xs w-32 text-center">Status</th>
                                <th className="px-6 py-3 font-bold text-gray-600 text-xs w-32 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Memuat data...</td></tr>
                            ) : filteredOptions.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Belum ada opsi.</td></tr>
                            ) : (
                                filteredOptions.map((item, index) => {
                                    const ItemIcon = ICON_BY_KEY[item.icon] ?? PenLine;
                                    return (
                                        <tr key={item.id} className={`transition-colors ${item.is_active ? 'hover:bg-gray-50/50' : 'bg-gray-50/60 text-gray-400'}`}>
                                            <td className="px-6 py-4 font-bold text-center">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-semibold text-gray-800">
                                                    <ItemIcon className="w-4 h-4" />
                                                    {item.label}
                                                    {item.is_locked && <Lock className="w-3.5 h-3.5 text-gray-400" title="Tidak dapat dihapus" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.code}</td>
                                            <td className="px-6 py-4 text-center">{item.sort_order}</td>
                                            <td className="px-6 py-4 text-center">{item.requires_source_link ? 'Ya' : 'Tidak'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {item.is_active ? 'AKTIF' : 'NONAKTIF'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                {!item.is_active && (
                                                    <button
                                                        onClick={() => toggleActive(item, true)}
                                                        disabled={isSubmitting}
                                                        className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
                                                        title="Aktifkan kembali"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setOptionToDelete(item); setIsDeleteModalOpen(true); }}
                                                    disabled={item.is_locked || !item.is_active}
                                                    className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title={item.is_locked ? 'Strava tidak dapat dihapus' : 'Hapus'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                open={isModalOpen}
                onClose={closeModal}
                title={modalMode === 'add' ? 'Tambah Opsi' : 'Edit Opsi'}
                icon={SelectedIcon}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" className="flex-1" onClick={closeModal} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" form="recorded-via-form" variant="primary" className="flex-1" loading={isSubmitting}>
                            Simpan
                        </Button>
                    </>
                }
            >
                <form id="recorded-via-form" onSubmit={handleSubmit} className="admin-form space-y-4">
                    <FormField label="Nama" required>
                        <Input
                            icon={SelectedIcon}
                            type="text"
                            required
                            placeholder="Contoh: Smartwatch"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        />
                    </FormField>

                    <FormField label="Kode" hint={isLockedSelected ? 'Kode Strava tidak dapat diubah.' : 'Kosongkan untuk dibuat otomatis dari nama.'}>
                        <Input
                            type="text"
                            disabled={isLockedSelected}
                            placeholder="otomatis-dari-nama"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                        />
                    </FormField>

                    <FormField label="Ikon">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F4F2FF] text-[#5A2EFF]">
                                <SelectedIcon className="w-5 h-5" />
                            </span>
                            <Select
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                className="flex-1"
                            >
                                {ICON_OPTIONS.map((option) => (
                                    <option key={option.key} value={option.key}>{option.label}</option>
                                ))}
                            </Select>
                        </div>
                    </FormField>

                    <FormField label="Urutan" hint="Kosongkan untuk otomatis diletakkan di akhir daftar.">
                        <Input
                            type="number"
                            min="0"
                            placeholder="otomatis"
                            value={formData.sort_order}
                            onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                        />
                    </FormField>

                    <FormField label="Aturan">
                        <CheckboxCard
                            checked={formData.requires_source_link}
                            disabled={isLockedSelected}
                            onChange={() => setFormData({ ...formData, requires_source_link: !formData.requires_source_link })}
                            label="Wajib mengisi link sumber"
                            description={isLockedSelected ? 'Aturan Strava tidak dapat diubah.' : 'Pengguna harus mengisi link sumber saat memilih opsi ini.'}
                        />
                    </FormField>

                    <FormField label="Status" hint={isLockedSelected ? 'Strava harus selalu aktif.' : undefined}>
                        <Select
                            value={formData.is_active}
                            disabled={isLockedSelected}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                        >
                            <option value="true">Aktif</option>
                            <option value="false">Nonaktif</option>
                        </Select>
                    </FormField>
                </form>
            </Modal>

            <ConfirmModal
                open={isDeleteModalOpen && !!optionToDelete}
                onClose={() => { setIsDeleteModalOpen(false); setOptionToDelete(null); }}
                onConfirm={executeDelete}
                title="Hapus Opsi?"
                description={`Opsi "${optionToDelete?.label}" akan dinonaktifkan dan tidak muncul lagi di aplikasi. Riwayat aktivitas lama yang memakai opsi ini tetap utuh.`}
                confirmLabel="Ya, Hapus"
                loading={isSubmitting}
            />
        </div>
    );
}
