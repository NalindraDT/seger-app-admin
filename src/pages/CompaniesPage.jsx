import { useState, useEffect } from 'react';
import {
    Landmark, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import {
    FormField, Input, Select, Textarea, Button, Modal, SearchBar, Toast, PageHeader, ConfirmModal, SortableTh
} from '../components/ui';
import { useTableSort } from '../hooks/useTableSort';
import { getBaseUrl } from '../utils/apiConfig';
import { isApiSuccess, getApiErrorMessage } from '../utils/apiFeedback';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', is_active: true
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState(null);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/companies?page=${currentPage}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                setCompanies(json.data.items);
                setTotalPages(json.data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Gagal mengambil data perusahaan", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, [currentPage]);

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('success');
        }, 4000);
    };

    const openAddModal = () => {
        setEditId(null);
        setFormData({ name: '', description: '', is_active: true });
        setIsFormModalOpen(true);
    };

    const openEditModal = (company) => {
        setEditId(company.id);
        setFormData({ name: company.name, description: company.description, is_active: company.is_active });
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const url = editId
                ? `${getBaseUrl()}/admin/companies/${editId}`
                : `${getBaseUrl()}/admin/companies`;
            const method = editId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const json = await response.json();
            if (isApiSuccess(json)) {
                setIsFormModalOpen(false);
                fetchCompanies();
                showToast(editId ? 'Perusahaan diperbarui!' : 'Perusahaan ditambahkan!');
            } else {
                showToast(getApiErrorMessage(json, 'Gagal menyimpan perusahaan.'), 'error');
            }
        } catch (error) {
            showToast('Kesalahan jaringan saat menyimpan data.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!companyToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/companies/${companyToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (isApiSuccess(json)) {
                setIsDeleteModalOpen(false);
                setCompanyToDelete(null);
                fetchCompanies();
                showToast('Perusahaan berhasil dihapus.');
            } else {
                setIsDeleteModalOpen(false);
                setCompanyToDelete(null);
                showToast(getApiErrorMessage(json, 'Gagal menghapus perusahaan.'), 'error');
            }
        } catch (error) {
            setIsDeleteModalOpen(false);
            setCompanyToDelete(null);
            showToast('Kesalahan jaringan saat menghapus data.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const { sortedItems: sortedCompanies, sortKey, sortDir, requestSort } = useTableSort(filteredCompanies);

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

            <PageHeader
                title="Manajemen Perusahaan"
                subtitle="Kelola data dan status perusahaan"
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <SearchBar
                    label="Cari Perusahaan"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama perusahaan..."
                    className="w-full md:max-w-md"
                />
                <Button icon={Plus} onClick={openAddModal}>
                    Tambah Perusahaan
                </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F9FAFB] border-b border-gray-100">
                            <tr>
                                <SortableTh label="No." sortable={false} align="center" className="text-[11px] w-16" />
                                <SortableTh label="Nama Perusahaan" sortKey="name" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="text-[11px]" />
                                <SortableTh label="Deskripsi" sortKey="description" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="text-[11px]" />
                                <SortableTh label="Status" sortKey="is_active" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="Aksi" sortable={false} align="center" className="text-[11px]" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500 font-medium"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5A2EFF]" />Memuat data...</td></tr>
                            ) : sortedCompanies.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500 font-medium">Data perusahaan tidak ditemukan.</td></tr>
                            ) : sortedCompanies.map((company, index) => (
                                <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800 text-center">{((currentPage - 1) * 10) + index + 1}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{company.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{company.description || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold tracking-widest ${company.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {company.is_active ? 'AKTIF' : 'NONAKTIF'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => openEditModal(company)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors" title="Edit Perusahaan"><Edit className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => { setCompanyToDelete(company); setIsDeleteModalOpen(true); }} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors" title="Hapus Perusahaan"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white">
                    <p className="text-sm text-gray-500 font-medium">Halaman {currentPage} dari {totalPages}</p>
                    <div className="flex space-x-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
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
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <Modal
                open={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editId ? 'Edit Perusahaan' : 'Tambah Perusahaan'}
                icon={Landmark}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" className="flex-1" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" form="company-form" variant="primary" className="flex-1" loading={isSubmitting}>
                            Simpan Perusahaan
                        </Button>
                    </>
                }
            >
                <form id="company-form" onSubmit={handleFormSubmit} className="admin-form space-y-4">
                    <FormField label="Nama Perusahaan" required>
                        <Input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Misal: PT PLN Nusantara Power"
                        />
                    </FormField>
                    <FormField label="Deskripsi">
                        <Textarea
                            rows={3}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Penjelasan singkat..."
                        />
                    </FormField>
                    <FormField label="Status">
                        <Select
                            value={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                        >
                            <option value="true">Aktif</option>
                            <option value="false">Nonaktif</option>
                        </Select>
                    </FormField>
                </form>
            </Modal>

            <ConfirmModal
                open={isDeleteModalOpen && !!companyToDelete}
                onClose={() => { setIsDeleteModalOpen(false); setCompanyToDelete(null); }}
                onConfirm={executeDelete}
                title="Hapus Perusahaan?"
                description={`Anda akan menghapus perusahaan "${companyToDelete?.name}" secara permanen. Pastikan tidak ada karyawan aktif di perusahaan ini.`}
                confirmLabel="Ya, Hapus"
                loading={isSubmitting}
            />
        </div>
    );
}
