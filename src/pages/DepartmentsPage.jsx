import { useState, useEffect } from 'react';
import {
    Building2, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import {
    FormField, Input, Select, Textarea, Button, Modal, SearchBar, Toast, PageHeader, ConfirmModal, SortableTh
} from '../components/ui';
import { useTableSort } from '../hooks/useTableSort';
import { getBaseUrl } from '../utils/apiConfig';
import { isApiSuccess, getApiErrorMessage } from '../utils/apiFeedback';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState([]);
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
    const [departmentToDelete, setDepartmentToDelete] = useState(null);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/departments?page=${currentPage}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                setDepartments(json.data.items);
                setTotalPages(json.data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Gagal mengambil data departemen", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
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

    const openEditModal = (dept) => {
        setEditId(dept.id);
        setFormData({ name: dept.name, description: dept.description, is_active: dept.is_active });
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const url = editId
                ? `${getBaseUrl()}/admin/departments/${editId}`
                : `${getBaseUrl()}/admin/departments`;
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
                fetchDepartments();
                showToast(editId ? 'Departemen diperbarui!' : 'Departemen ditambahkan!');
            } else {
                showToast(getApiErrorMessage(json, 'Gagal menyimpan departemen.'), 'error');
            }
        } catch (error) {
            showToast('Kesalahan jaringan saat menyimpan data.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!departmentToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/departments/${departmentToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (isApiSuccess(json)) {
                setIsDeleteModalOpen(false);
                setDepartmentToDelete(null);
                fetchDepartments();
                showToast('Departemen berhasil dihapus.');
            } else {
                setIsDeleteModalOpen(false);
                setDepartmentToDelete(null);
                showToast(getApiErrorMessage(json, 'Gagal menghapus departemen.'), 'error');
            }
        } catch (error) {
            setIsDeleteModalOpen(false);
            setDepartmentToDelete(null);
            showToast('Kesalahan jaringan saat menghapus data.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const { sortedItems: sortedDepartments, sortKey, sortDir, requestSort } = useTableSort(filteredDepartments);

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

            <PageHeader
                title="Manajemen Departemen"
                subtitle="Kelola data dan status departemen perusahaan"
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <SearchBar
                    label="Cari Departemen"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama departemen..."
                    className="w-full md:max-w-md"
                />
                <Button icon={Plus} onClick={openAddModal}>
                    Tambah Departemen
                </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F9FAFB] border-b border-gray-100">
                            <tr>
                                <SortableTh label="No." sortable={false} align="center" className="text-[11px] w-16" />
                                <SortableTh label="Nama Departemen" sortKey="name" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="text-[11px]" />
                                <SortableTh label="Deskripsi" sortKey="description" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="text-[11px]" />
                                <SortableTh label="Status" sortKey="is_active" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="Aksi" sortable={false} align="center" className="text-[11px]" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500 font-medium"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5A2EFF]" />Memuat data...</td></tr>
                            ) : sortedDepartments.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500 font-medium">Data departemen tidak ditemukan.</td></tr>
                            ) : sortedDepartments.map((dept, index) => (
                                <tr key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800 text-center">{((currentPage - 1) * 10) + index + 1}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{dept.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{dept.description || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold tracking-widest ${dept.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {dept.is_active ? 'AKTIF' : 'NONAKTIF'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => openEditModal(dept)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors" title="Edit Departemen"><Edit className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => { setDepartmentToDelete(dept); setIsDeleteModalOpen(true); }} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors" title="Hapus Departemen"><Trash2 className="w-3.5 h-3.5" /></button>
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
                        <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#5A2EFF] text-white font-bold text-sm">{currentPage}</button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <Modal
                open={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editId ? 'Edit Departemen' : 'Tambah Departemen'}
                icon={Building2}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" className="flex-1" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" form="department-form" variant="primary" className="flex-1" loading={isSubmitting}>
                            Simpan Departemen
                        </Button>
                    </>
                }
            >
                <form id="department-form" onSubmit={handleFormSubmit} className="admin-form space-y-4">
                    <FormField label="Nama Departemen" required>
                        <Input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Misal: Plant Operations"
                        />
                    </FormField>
                    <FormField label="Deskripsi">
                        <Textarea
                            rows={3}
                            value={formData.description}
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
                open={isDeleteModalOpen && !!departmentToDelete}
                onClose={() => { setIsDeleteModalOpen(false); setDepartmentToDelete(null); }}
                onConfirm={executeDelete}
                title="Hapus Departemen?"
                description={`Anda akan menghapus departemen "${departmentToDelete?.name}" secara permanen. Pastikan tidak ada karyawan aktif di departemen ini.`}
                confirmLabel="Ya, Hapus"
                loading={isSubmitting}
            />
        </div>
    );
}
