import { useState, useEffect } from 'react';
import {
    Building2, Search, Plus, Edit, Trash2, X, 
    CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { BASE_URL } from '../utils/apiConfig';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [toastMessage, setToastMessage] = useState('');

    // STATE MODAL FORM (TAMBAH/EDIT)
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', is_active: true
    });

    // STATE MODAL HAPUS
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${BASE_URL}/admin/departments?page=${currentPage}&limit=10`, {
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

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 4000);
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

    // HANDLER SIMPAN (TAMBAH / EDIT)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const url = editId 
                ? `${BASE_URL}/admin/departments/${editId}` 
                : `${BASE_URL}/admin/departments`;
            const method = editId ? 'PUT' : 'POST'; // Sesuaikan jika backend pakai PATCH

            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });

            const json = await response.json();
            if (json.success || response.ok) {
                setIsFormModalOpen(false);
                fetchDepartments();
                showToast(editId ? 'Departemen diperbarui!' : 'Departemen ditambahkan!');
            } else {
                alert(json.message || "Gagal menyimpan departemen.");
            }
        } catch (error) {
            alert("Kesalahan jaringan saat menyimpan data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // HANDLER HAPUS
    const executeDelete = async () => {
        if (!departmentToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${BASE_URL}/admin/departments/${departmentToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success || response.ok) {
                setIsDeleteModalOpen(false);
                setDepartmentToDelete(null);
                fetchDepartments();
                showToast('Departemen berhasil dihapus.');
            } else {
                alert(json.message || "Gagal menghapus departemen.");
            }
        } catch (error) {
            alert("Kesalahan jaringan saat menghapus data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            {/* HEADER & TOOLBAR */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center">
                    <Building2 className="w-7 h-7 mr-3 text-[#5A2EFF]" /> Manajemen Departemen
                </h1>
                <p className="text-sm text-gray-500 mt-1">Kelola data dan status departemen perusahaan</p>
            </div>

            {/* TOOLBAR (PENCARIAN & TOMBOL) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
                {/* PENCARIAN */}
                <div className="relative w-full md:max-w-md">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Cari nama departemen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]"
                    />
                </div>

                {/* TOMBOL TAMBAH */}
                <button 
                    onClick={openAddModal} 
                    className="flex items-center px-4 py-2.5 bg-[#5A2EFF] text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" /> Tambah Departemen
                </button>
            </div>


            {/* TABEL DEPARTEMEN */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F9FAFB] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider text-center w-16">No.</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Nama Departemen</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Deskripsi</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500 font-medium"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5A2EFF]"/>Memuat data...</td></tr>
                            ) : filteredDepartments.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500 font-medium">Data departemen tidak ditemukan.</td></tr>
                            ) : filteredDepartments.map((dept, index) => (
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
                {/* PAGINATION */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                    <p className="text-sm text-gray-500 font-medium">Halaman {currentPage} dari {totalPages}</p>
                    <div className="flex space-x-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#5A2EFF] text-white font-bold text-sm">{currentPage}</button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* MODAL FORM (TAMBAH / EDIT) */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Departemen' : 'Tambah Departemen'}</h2>
                            <button onClick={() => setIsFormModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Nama Departemen</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" placeholder="Misal: Plant Operations" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Deskripsi</label>
                                    <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" placeholder="Penjelasan singkat..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Status</label>
                                    <select value={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })} className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]">
                                        <option value="true">Aktif</option>
                                        <option value="false">Nonaktif</option>
                                    </select>
                                </div>
                            </div>
                            <div className="px-6 py-5 border-t border-gray-100 bg-white flex space-x-3">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-[#5A2EFF] text-white font-bold hover:bg-indigo-700 shadow-sm transition-colors">
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Departemen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL HAPUS */}
            {isDeleteModalOpen && departmentToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Hapus Departemen?</h3>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Anda akan menghapus departemen <strong className="text-gray-700">"{departmentToDelete.name}"</strong> secara permanen. Pastikan tidak ada karyawan aktif di departemen ini.
                        </p>
                        <div className="flex space-x-3">
                            <button onClick={() => { setIsDeleteModalOpen(false); setDepartmentToDelete(null); }} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50">Batal</button>
                            <button onClick={executeDelete} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-sm">{isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}