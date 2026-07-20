import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx-js-style';
import {
    Users, UserCheck, Search, Upload, Edit, Eye, ChevronLeft, ChevronRight,
    X, CheckCircle2, AlertTriangle, FileDown, UploadCloud, FileSpreadsheet,
    User as UserIcon, Mail, Phone, Shield, TrendingUp, Flame, Trash2, Plus
} from 'lucide-react';
import { BASE_URL } from '../utils/apiConfig';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const [stats, setStats] = useState({ total: 0, active: 0 });
    const [departments, setDepartments] = useState([]);

    // STATE UNTUK MODAL TAMBAH USER MANUAl
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addFormData, setAddFormData] = useState({
        email: '', password: '', full_name: '', phone_number: '', department_id: ''
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '', phone_number: '', department_id: '', is_active: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // STATE UNTUK MODAL HAPUS
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const [detailUser, setDetailUser] = useState(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${BASE_URL}/admin/users?page=${currentPage}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) {
                setUsers(json.data.items);
                setTotalPages(json.data.pagination.totalPages);
                setTotalItems(json.data.pagination.totalItems);
            }
        } catch (error) {
            console.error("Gagal mengambil data user", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${BASE_URL}/admin/dashboard?range=7d`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.status === 'success' || json.success) {
                setStats({
                    total: json.data.summary.total_users.value,
                    active: json.data.summary.total_users.value
                });
            }
        } catch (error) {
            console.error("Gagal mengambil statistik");
        }
    };

    const fetchDepartments = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${BASE_URL}/admin/departments?page=1&limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) {
                setDepartments(json.data.items);
            }
        } catch (error) {
            console.error("Gagal mengambil data departemen", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchStats();
        fetchDepartments();
    }, [currentPage]);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 4000);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(addFormData)
            });

            const json = await response.json();
            
            if (response.ok && (json.success || json.status === 'success')) {
                setIsAddModalOpen(false);
                setAddFormData({ email: '', password: '', full_name: '', phone_number: '', department_id: '' });
                fetchUsers();
                fetchStats();
                showToast('User berhasil ditambahkan!');
            } else {
                alert(json.message || "Gagal menambahkan user.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDetailModal = async (userId) => {
        setIsDetailModalOpen(true);
        setIsFetchingDetail(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${BASE_URL}/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) {
                setDetailUser(json.data);
            }
        } catch (error) {
            alert("Kesalahan jaringan saat mengambil detail.");
            setIsDetailModalOpen(false);
        } finally {
            setIsFetchingDetail(false);
        }
    };

    const handleDownloadTemplate = () => {
        // 1. Ubah department_id menjadi department_name
        const header = ["email", "full_name", "password", "department_name"];
        // 2. Beri contoh isi dengan nama departemen yang valid
        const rowData = ["user@example.com", "User Demo", "userpltu123", "Plant Operations"];

        const ws = XLSX.utils.aoa_to_sheet([header, rowData]);

        const headerStyle = {
            fill: { fgColor: { rgb: "5A2EFF" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!ws[address]) continue;
            ws[address].s = headerStyle;
        }

        ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 35 }];
        ws['!rows'] = [{ hpt: 25 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Import Template");
        XLSX.writeFile(wb, "template_import_user.xlsx");
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const formDataUpload = new FormData();
            formDataUpload.append('file', selectedFile);

            const response = await fetch(`${BASE_URL}/admin/users/import`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formDataUpload
            });
            const json = await response.json();
            if (json.success) {
                setIsImportModalOpen(false);
                setSelectedFile(null);
                fetchUsers();
                fetchStats();
                showToast(`Import Berhasil! Sukses: ${json.data.success_rows}, Gagal: ${json.data.failed_rows}.`);
            } else {
                alert(json.message || "Gagal import data.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (user) => {
        setSelectedUserId(user.id);
        setFormData({
            full_name: user.fullName,
            phone_number: user.phoneNumber || '',
            department_id: user.departmentId || '',
            is_active: user.isActive
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${BASE_URL}/admin/users/${selectedUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            const json = await response.json();
            if (json.success || json.status === 'success') {
                setIsEditModalOpen(false);
                fetchUsers();
                showToast('User berhasil diperbarui!');
            } else {
                alert(json.message || "Gagal memperbarui user.");
            }
        } catch (error) {
            alert("Gagal update user.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!userToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${BASE_URL}/admin/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success || json.status === 'success') {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                fetchUsers();
                fetchStats();
                showToast('User telah dihapus.');
            } else {
                alert(json.message || "Gagal hapus user.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
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

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Users</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola data anggota komunitas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#5A2EFF] mb-4"><Users className="w-5 h-5" /></div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Total User</p>
                    <h3 className="text-3xl font-extrabold text-[#5A2EFF]">{stats.total.toLocaleString()}</h3>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
                <div className="relative w-full md:max-w-md">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Cari email atau nama user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]"
                    />
                </div>
                <div className="flex space-x-3 w-full md:w-auto">
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-[#5A2EFF] text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors">
                        <Plus className="w-4 h-4 mr-2" /> Tambah
                    </button>
                    <button onClick={() => setIsImportModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-white border border-[#5A2EFF] text-[#5A2EFF] rounded-xl text-sm font-bold hover:bg-indigo-50 shadow-sm transition-colors">
                        <Upload className="w-4 h-4 mr-2" /> Import
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F9FAFB] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider text-center w-16">No.</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Nama user</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Role user</th>
                                {/* TAMBAHAN: Kolom Departemen */}
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Departemen</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider text-center">Point</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider text-center">EXP</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-[11px] uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* NOTE: colSpan diubah dari 7 menjadi 8 karena ada penambahan kolom */}
                            {isLoading ? (
                                <tr><td colSpan="8" className="text-center py-10 text-gray-500 font-medium">Memuat data user...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-10 text-gray-500 font-medium">User tidak ditemukan.</td></tr>
                            ) : filteredUsers.map((user, index) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800 text-center">{((currentPage - 1) * 10) + index + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <img 
                                                src={user.profilePhotoUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`} 
                                                alt="Avatar" 
                                                className="w-9 h-9 rounded-full object-cover border border-gray-200" 
                                                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user.fullName}&background=F3F4F6`; }}
                                            />
                                            <div>
                                                <p className="font-bold text-gray-800">{user.fullName}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><span className="capitalize font-medium text-gray-600">{user.role}</span></td>
                                    
                                    {/* TAMBAHAN: Data Departemen */}
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-700">
                                            {user.departmentName || <span className="text-gray-400 italic">Belum diatur</span>}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 font-bold text-gray-700 text-center">{user.pointsBalance}</td>
                                    <td className="px-6 py-4 font-bold text-gray-700 text-center">{user.xpBalance}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold tracking-widest ${user.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {user.isActive ? 'AKTIF' : 'OFF'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center space-x-2">
                                            {user.role.toLowerCase() !== 'admin' && (
                                                <>
                                                    <button onClick={() => openEditModal(user)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors" title="Edit User"><Edit className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors" title="Hapus User"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </>
                                            )}
                                            <button onClick={() => openDetailModal(user.id)} className="p-1.5 bg-indigo-50 text-[#5A2EFF] rounded-md hover:bg-indigo-100 transition-colors" title="Detail User"><Eye className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                    <p className="text-sm text-gray-500 font-medium">Halaman {currentPage} dari {totalPages}</p>
                    <div className="flex space-x-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#5A2EFF] text-white font-bold text-sm">{currentPage}</button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* MODAL TAMBAH USER MANUAl */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-indigo-100 text-[#5A2EFF] rounded-full flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Tambah User Baru</h2>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Nama Lengkap</label>
                                        <input type="text" required value={addFormData.full_name} onChange={(e) => setAddFormData({ ...addFormData, full_name: e.target.value })} placeholder="Misal: John Doe" className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Alamat Email</label>
                                        <input type="email" required value={addFormData.email} onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })} placeholder="user@example.com" className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Password</label>
                                        <input type="password" required value={addFormData.password} onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })} placeholder="Minimal 8 karakter" minLength={8} className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Nomor Telepon</label>
                                        <input type="tel" value={addFormData.phone_number} onChange={(e) => setAddFormData({ ...addFormData, phone_number: e.target.value })} placeholder="08xxxxxxxxxx" className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Departemen</label>
                                        <select required value={addFormData.department_id} onChange={(e) => setAddFormData({ ...addFormData, department_id: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]">
                                            <option value="" disabled>Pilih Departemen...</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5 border-t border-gray-100 bg-white flex space-x-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting || !addFormData.department_id} className="flex-1 px-4 py-3 rounded-xl bg-[#5A2EFF] text-white font-bold hover:bg-indigo-600 shadow-sm transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL IMPORT EXCEL */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-indigo-100 text-[#5A2EFF] rounded-full flex items-center justify-center">
                                    <UploadCloud className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Import User</h2>
                                    <p className="text-[11px] font-medium text-gray-500">Gunakan file Excel untuk data masal</p>
                                </div>
                            </div>
                            <button onClick={() => setIsImportModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleImportSubmit} className="p-6 space-y-6">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                                <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center">
                                    <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" /> Petunjuk
                                </h4>
                                <ul className="text-sm text-blue-800/80 space-y-2 mb-5 list-disc pl-5 font-medium">
                                    <li>Gunakan template Excel (.xlsx) yang disediakan.</li>
                                    <li>Pastikan kolom <strong>email</strong>, <strong>full_name</strong>, dan <strong>department_name</strong> tidak kosong.</li>
                                    <li>Sistem akan men-generate password otomatis jika kolom password dikosongkan.</li>
                                </ul>
                                <button 
                                    type="button" 
                                    onClick={handleDownloadTemplate} 
                                    className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-blue-200 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm"
                                >
                                    <FileDown className="w-4 h-4 mr-2" /> Download Template .xlsx
                                </button>
                            </div>

                            <div>
                                <input 
                                    type="file" 
                                    accept=".xlsx, .xls" 
                                    onChange={(e) => setSelectedFile(e.target.files[0])} 
                                    required 
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#F8F9FC] file:text-[#5A2EFF] border border-gray-200 rounded-xl cursor-pointer" 
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsImportModalOpen(false)} 
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || !selectedFile} 
                                    className="flex-1 px-4 py-3 rounded-xl bg-[#5A2EFF] text-white font-bold hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Mengunggah...' : 'Upload Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL */}
            {isDetailModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm flex-shrink-0">
                            <div className="flex items-center space-x-4">
                                {detailUser && detailUser.profilePhotoUrl ? (
                                    <img src={detailUser.profilePhotoUrl} alt="Avatar Modal Header" className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" />
                                ) : (
                                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-[#5A2EFF]" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-lg font-extrabold text-gray-900 leading-tight">Detail User</h2>
                                    <p className="text-[11px] font-medium text-gray-500">Informasi lengkap akun</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="p-8 bg-[#F8F9FC] overflow-y-auto">
                            {isFetchingDetail ? (
                                <div className="text-center py-10 font-bold">Mengambil data...</div>
                            ) : detailUser && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center space-x-5 mb-5">
                                            <img 
                                                src={detailUser.profilePhotoUrl || `https://ui-avatars.com/api/?name=${detailUser.fullName}&background=random&size=128`} 
                                                alt="Profile Besar" 
                                                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-50 shadow-sm" 
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-extrabold text-xl text-gray-900">{detailUser.fullName}</h3>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${detailUser.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{detailUser.isActive ? 'Active' : 'Inactive'}</span>
                                                </div>
                                                <div className="flex space-x-4 mt-2">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 block">ROLE</label>
                                                        <div className="text-sm font-semibold capitalize text-gray-800">{detailUser.role}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="font-bold flex items-center text-sm mb-4"><Mail className="w-4 h-4 text-[#5A2EFF] mr-2" /> Kontak</h3>
                                        <label className="text-[10px] font-bold text-gray-500">EMAIL</label>
                                        <div className="bg-[#F8F9FC] p-2.5 rounded-xl text-sm font-semibold mt-1 mb-3">{detailUser.email}</div>
                                        <label className="text-[10px] font-bold text-gray-500">PHONE</label>
                                        <div className="bg-[#F8F9FC] p-2.5 rounded-xl text-sm font-semibold mt-1">{detailUser.phoneNumber || '-'}</div>
                                    </div>

                                    <div className="rounded-2xl bg-gradient-to-br from-[#7F56D9] to-[#5A2EFF] p-5 text-white shadow-md relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h3 className="font-bold flex items-center text-sm mb-5"><TrendingUp className="w-4 h-4 mr-2" /> Engagement</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white/95 rounded-xl p-3 text-center">
                                                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Points</p>
                                                    <p className="text-xl font-black text-[#5A2EFF]">{detailUser.pointsBalance}</p>
                                                </div>
                                                <div className="bg-white/95 rounded-xl p-3 text-center">
                                                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">EXP</p>
                                                    <p className="text-xl font-black text-orange-500">{detailUser.xpBalance}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-5 -right-5 opacity-20"><Flame className="w-24 h-24" /></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end flex-shrink-0">
                            <button onClick={() => setIsDetailModalOpen(false)} className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors shadow-sm">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDIT */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Nama User / Username</label>
                                    <input type="text" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Phone Number</label>
                                    <input type="tel" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]" />
                                </div>
                                
                                {/* DROPDOWN DEPARTEMEN */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Departemen</label>
                                    <select required value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]">
                                        <option value="" disabled>Pilih Departemen...</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Status</label>
                                    <select value={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })} className="w-full px-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]">
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="px-6 py-5 border-t border-gray-100 bg-white flex space-x-3">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-[#5A2EFF] text-white font-bold hover:bg-indigo-700 shadow-sm transition-colors">{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL HAPUS */}
            {isDeleteModalOpen && userToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Hapus User?</h3>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Anda akan menghapus user <strong className="text-gray-700">"{userToDelete?.fullName}"</strong>. Semua histori poin dan aktivitasnya akan ikut terhapus secara permanen.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
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