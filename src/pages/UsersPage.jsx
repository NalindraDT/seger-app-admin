import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx-js-style';
import {
    Users, Upload, Edit, Eye, ChevronLeft, ChevronRight,
    FileDown, FileSpreadsheet, User as UserIcon, Mail, TrendingUp, Flame, Trash2, Plus, Activity
} from 'lucide-react';
import {
    FormField, Input, Select, Button, Modal, Toast, ConfirmModal, FileUpload, SearchBar, SortableTh
} from '../components/ui';
import { useTableSort } from '../hooks/useTableSort';
import { getBaseUrl } from '../utils/apiConfig';
import { isApiSuccess, getApiErrorMessage } from '../utils/apiFeedback';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const debounceRef = useRef(null);

    const [stats, setStats] = useState({ total: 0, active: 0 });
    const [departments, setDepartments] = useState([]);
    const [companies, setCompanies] = useState([]);

    // STATE UNTUK MODAL TAMBAH USER MANUAl
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addFormData, setAddFormData] = useState({
        email: '', password: '', full_name: '', phone_number: '', department_id: '', company_id: '', role: 'participant'
    });
    const [addFormErrors, setAddFormErrors] = useState({});

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '', phone_number: '', department_id: '', company_id: '', is_active: true, role: 'participant'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // STATE UNTUK MODAL HAPUS
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const [detailUser, setDetailUser] = useState(null);
    const [detailActivities, setDetailActivities] = useState([]);
    const [detailActivitiesPage, setDetailActivitiesPage] = useState(1);
    const [detailActivitiesTotalPages, setDetailActivitiesTotalPages] = useState(1);
    const [selectedActivityDetail, setSelectedActivityDetail] = useState(null);

    const getUserPoints = (user) => Number(user?.pointsBalance ?? user?.points_balance ?? 0);
    const getUserXp = (user) => Number(user?.xpBalance ?? user?.xp_balance ?? 0);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const searchQuery = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
            const response = await fetch(`${getBaseUrl()}/admin/users?page=${currentPage}&limit=10${searchQuery}`, {
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
            // Total User harus dari seluruh users, bukan metrik dashboard mingguan (user baru).
            const response = await fetch(`${getBaseUrl()}/admin/users?page=1&limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) {
                const total = json.data.pagination?.totalItems ?? 0;
                setStats({ total, active: total });
            }
        } catch (error) {
            console.error("Gagal mengambil statistik");
        }
    };

    const fetchDepartments = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/departments?page=1&limit=100`, {
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

    const fetchCompanies = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/companies?page=1&limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) {
                setCompanies(json.data.items);
            }
        } catch (error) {
            console.error("Gagal mengambil data perusahaan", error);
        }
    };

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [searchTerm]);

    useEffect(() => {
        fetchStats();
        fetchDepartments();
        fetchCompanies();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [currentPage, debouncedSearch]);

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('success');
        }, 4000);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setAddFormData({ email: '', password: '', full_name: '', phone_number: '', department_id: '', company_id: '', role: 'participant' });
        setAddFormErrors({});
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setAddFormErrors({});
        try {
            const token = localStorage.getItem('jwt_token');
            const payload = {
                email: addFormData.email,
                password: addFormData.password,
                full_name: addFormData.full_name,
                role: addFormData.role,
                is_active: true,
            };
            if (addFormData.phone_number) payload.phone_number = addFormData.phone_number;
            if (addFormData.department_id) payload.department_id = addFormData.department_id;
            if (addFormData.company_id) payload.company_id = addFormData.company_id;

            const response = await fetch(`${getBaseUrl()}/admin/users`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            const json = await response.json();
            
            if (isApiSuccess(json)) {
                closeAddModal();
                fetchUsers();
                fetchStats();
                showToast('User berhasil ditambahkan!');
            } else {
                const errorCode = json.error?.code;

                if (errorCode === 'VALIDATION_ERROR' || response.status === 400) {
                    const fieldErrors = json.error?.details?.fieldErrors || {};
                    const newErrors = {};
                    Object.keys(fieldErrors).forEach((field) => {
                        const messages = fieldErrors[field];
                        newErrors[field] = Array.isArray(messages) ? messages[0] : messages;
                    });
                    setAddFormErrors(newErrors);
                } else if (response.status === 409 || errorCode === 'EMAIL_ALREADY_EXISTS') {
                    setAddFormErrors({ email: 'Email sudah terdaftar, gunakan email lain.' });
                } else {
                    showToast(getApiErrorMessage(json, 'Gagal menambahkan user.'), 'error');
                }
            }
        } catch (error) {
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDetailModal = async (userId) => {
        setIsDetailModalOpen(true);
        setIsFetchingDetail(true);
        setDetailActivities([]);
        setDetailActivitiesPage(1);
        setSelectedActivityDetail(null);
        try {
            const token = localStorage.getItem('jwt_token');
            const [profileRes, activitiesRes] = await Promise.all([
                fetch(`${getBaseUrl()}/admin/users/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${getBaseUrl()}/admin/users/${userId}/activities?page=1&limit=10`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
            ]);
            const profileJson = await profileRes.json();
            const activitiesJson = await activitiesRes.json();

            if (profileJson.success) {
                setDetailUser(profileJson.data);
            }
            if (activitiesJson.success) {
                const payload = activitiesJson.data;
                const annual = payload.activity_items ?? [];
                const event = payload.event_items ?? [];
                const merged = [...annual, ...event].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
                setDetailActivities(merged.length > 0 ? merged : (payload.items ?? []));
                setDetailActivitiesPage(payload.pagination?.page ?? 1);
                setDetailActivitiesTotalPages(payload.pagination?.totalPages ?? 1);
            }
        } catch (error) {
            showToast('Kesalahan jaringan saat mengambil detail.', 'error');
            setIsDetailModalOpen(false);
        } finally {
            setIsFetchingDetail(false);
        }
    };

    const fetchDetailActivities = async (userId, page = 1) => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/users/${userId}/activities?page=${page}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) {
                const payload = json.data;
                const annual = payload.activity_items ?? [];
                const event = payload.event_items ?? [];
                const merged = [...annual, ...event].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
                setDetailActivities(merged.length > 0 ? merged : (payload.items ?? []));
                setDetailActivitiesPage(payload.pagination?.page ?? page);
                setDetailActivitiesTotalPages(payload.pagination?.totalPages ?? 1);
            }
        } catch (error) {
            console.error('Gagal memuat riwayat aktivitas peserta', error);
        }
    };

    const handleDownloadTemplate = () => {
        const header = ["email", "full_name", "password", "company_name", "department_name"];
        const rowData = ["user@example.com", "User Demo", "userpltu123", "PLN Indonesia Power", "Plant Operations"];

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

        ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 28 }, { wch: 35 }];
        ws['!rows'] = [{ hpt: 25 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Import Template");
        XLSX.writeFile(wb, "template_import_user.xlsx");
    };

    const handleExportUsers = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/users/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorJson = await response.json().catch(() => null);
                throw new Error(errorJson?.error?.message || errorJson?.message || 'Gagal export data user.');
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition') || '';
            const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
            const fileName = fileNameMatch?.[1] || `users-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showToast('Data user berhasil diekspor!');
        } catch (error) {
            showToast(error.message || 'Terjadi kesalahan saat export data user.', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const formDataUpload = new FormData();
            formDataUpload.append('file', selectedFile);

            const response = await fetch(`${getBaseUrl()}/admin/users/import`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formDataUpload
            });
            const json = await response.json();
            if (isApiSuccess(json)) {
                setIsImportModalOpen(false);
                setSelectedFile(null);
                fetchUsers();
                fetchStats();
                showToast(`Import Berhasil! Sukses: ${json.data.success_rows}, Gagal: ${json.data.failed_rows}.`);
            } else {
                showToast(getApiErrorMessage(json, 'Gagal import data.'), 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan jaringan.', 'error');
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
            company_id: user.companyId || '',
            is_active: user.isActive,
            role: user.role || 'participant'
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/users/${selectedUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            const json = await response.json();
            if (isApiSuccess(json)) {
                setIsEditModalOpen(false);
                fetchUsers();
                showToast('User berhasil diperbarui!');
            } else {
                showToast(getApiErrorMessage(json, 'Gagal memperbarui user.'), 'error');
            }
        } catch (error) {
            showToast('Gagal update user.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!userToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (isApiSuccess(json)) {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                fetchUsers();
                fetchStats();
                showToast('User telah dihapus.');
            } else {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                showToast(getApiErrorMessage(json, 'Gagal hapus user.'), 'error');
            }
        } catch (error) {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users;
    const { sortedItems: sortedUsers, sortKey, sortDir, requestSort } = useTableSort(filteredUsers, {
        accessors: {
            points: getUserPoints,
            xp: getUserXp,
        },
    });

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        const end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

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
            <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <SearchBar
                    label="Cari User"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Cari email atau nama user..."
                    className="w-full md:max-w-md"
                />
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-1 min-w-[120px] md:flex-none flex items-center justify-center px-5 py-2.5 bg-[#5A2EFF] text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors">
                        <Plus className="w-4 h-4 mr-2" /> Tambah
                    </button>
                    <button onClick={() => setIsImportModalOpen(true)} className="flex-1 min-w-[120px] md:flex-none flex items-center justify-center px-5 py-2.5 bg-white border border-[#5A2EFF] text-[#5A2EFF] rounded-xl text-sm font-bold hover:bg-indigo-50 shadow-sm transition-colors">
                        <Upload className="w-4 h-4 mr-2" /> Import
                    </button>
                    <button
                        onClick={handleExportUsers}
                        disabled={isExporting}
                        className="flex-1 min-w-[120px] md:flex-none flex items-center justify-center px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-60"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        {isExporting ? 'Export...' : 'Export'}
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F9FAFB] border-b border-gray-100">
                            <tr>
                                <SortableTh label="No." sortable={false} align="center" className="text-[11px] w-16" />
                                <SortableTh label="Nama user" sortKey="fullName" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="text-[11px]" />
                                <SortableTh label="Role user" sortKey="role" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="text-[11px]" />
                                <SortableTh label="Perusahaan" sortKey="companyName" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="text-[11px]" />
                                <SortableTh label="Departemen" sortKey="departmentName" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="text-[11px]" />
                                <SortableTh label="Point" sortKey="points" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="EXP" sortKey="xp" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="Status" sortKey="isActive" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="text-[11px]" />
                                <SortableTh label="Actions" sortable={false} align="center" className="text-[11px]" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* NOTE: colSpan diubah dari 7 menjadi 8 karena ada penambahan kolom */}
                            {isLoading ? (
                                <tr><td colSpan="9" className="text-center py-10 text-gray-500 font-medium">Memuat data user...</td></tr>
                            ) : sortedUsers.length === 0 ? (
                                <tr><td colSpan="9" className="text-center py-10 text-gray-500 font-medium">User tidak ditemukan.</td></tr>
                            ) : sortedUsers.map((user, index) => (
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
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                                            user.role === 'admin'
                                                ? 'bg-purple-50 text-purple-600'
                                                : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-700">
                                            {user.companyName || <span className="text-gray-400 italic">Belum diatur</span>}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-700">
                                            {user.departmentName || <span className="text-gray-400 italic">Belum diatur</span>}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 font-bold text-gray-700 text-center">{getUserPoints(user)}</td>
                                    <td className="px-6 py-4 font-bold text-gray-700 text-center">{getUserXp(user)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold tracking-widest ${user.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {user.isActive ? 'AKTIF' : 'OFF'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => openEditModal(user)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors" title="Edit User"><Edit className="w-3.5 h-3.5" /></button>
                                            {user.role.toLowerCase() !== 'admin' && (
                                                <button onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors" title="Hapus User"><Trash2 className="w-3.5 h-3.5" /></button>
                                            )}
                                            <button onClick={() => openDetailModal(user.id)} className="p-1.5 bg-indigo-50 text-[#5A2EFF] rounded-md hover:bg-indigo-100 transition-colors" title="Detail User"><Eye className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white">
                    <p className="text-sm text-gray-500 font-medium">Halaman {currentPage} dari {totalPages} · {totalItems} pengguna</p>
                    <div className="flex flex-wrap gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                        {getPageNumbers().map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold transition-colors ${page === currentPage ? 'bg-[#5A2EFF] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                                {page}
                            </button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <Modal
                open={isAddModalOpen}
                onClose={closeAddModal}
                title="Tambah User Baru"
                icon={Plus}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" className="flex-1" onClick={closeAddModal} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="add-user-form"
                            variant="primary"
                            className="flex-1"
                            loading={isSubmitting}
                            disabled={!addFormData.department_id}
                        >
                            Simpan User
                        </Button>
                    </>
                }
            >
                <form id="add-user-form" onSubmit={handleAddSubmit} className="admin-form space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Nama Lengkap" required className="md:col-span-2">
                            <Input
                                type="text"
                                required
                                value={addFormData.full_name}
                                onChange={(e) => setAddFormData({ ...addFormData, full_name: e.target.value })}
                                placeholder="Misal: John Doe"
                            />
                        </FormField>
                        <FormField label="Alamat Email" required error={addFormErrors.email}>
                            <Input
                                type="email"
                                required
                                value={addFormData.email}
                                onChange={(e) => {
                                    setAddFormData({ ...addFormData, email: e.target.value });
                                    if (addFormErrors.email) setAddFormErrors({ ...addFormErrors, email: '' });
                                }}
                                placeholder="user@example.com"
                                error={!!addFormErrors.email}
                            />
                        </FormField>
                        <FormField label="Password" required>
                            <Input
                                type="password"
                                required
                                value={addFormData.password}
                                onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                                placeholder="Minimal 8 karakter"
                                minLength={8}
                            />
                        </FormField>
                        <FormField label="Nomor Telepon" optional>
                            <Input
                                type="tel"
                                value={addFormData.phone_number}
                                onChange={(e) => setAddFormData({ ...addFormData, phone_number: e.target.value })}
                                placeholder="08xxxxxxxxxx"
                            />
                        </FormField>
                        <FormField label="Role">
                            <Select
                                value={addFormData.role}
                                onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                            >
                                <option value="participant">Participant</option>
                                <option value="admin">Admin</option>
                            </Select>
                        </FormField>
                        <FormField label="Perusahaan" optional>
                            <Select
                                value={addFormData.company_id}
                                onChange={(e) => setAddFormData({ ...addFormData, company_id: e.target.value })}
                            >
                                <option value="">Pilih Perusahaan (Opsional)...</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>{company.name}</option>
                                ))}
                            </Select>
                        </FormField>
                        <FormField label="Departemen" required>
                            <Select
                                required
                                value={addFormData.department_id}
                                onChange={(e) => setAddFormData({ ...addFormData, department_id: e.target.value })}
                            >
                                <option value="" disabled>Pilih Departemen...</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </Select>
                        </FormField>
                    </div>
                </form>
            </Modal>

            <Modal
                open={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import User"
                subtitle="Gunakan file Excel untuk data masal"
                icon={Upload}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" className="flex-1" onClick={() => setIsImportModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="import-user-form"
                            variant="primary"
                            className="flex-1"
                            loading={isSubmitting}
                            disabled={!selectedFile}
                        >
                            Upload Data
                        </Button>
                    </>
                }
            >
                <form id="import-user-form" onSubmit={handleImportSubmit} className="admin-form space-y-4">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                        <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center">
                            <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" /> Petunjuk
                        </h4>
                        <ul className="text-sm text-blue-800/80 space-y-2 mb-5 list-disc pl-5 font-medium">
                            <li>Gunakan template Excel (.xlsx) yang disediakan.</li>
                            <li>Kolom wajib: email, full_name. Kolom opsional: password, company_name, department_name.</li>
                            <li>Pastikan kolom <strong>email</strong>, <strong>full_name</strong>, dan <strong>department_name</strong> tidak kosong.</li>
                            <li>Sistem akan men-generate password otomatis jika kolom password dikosongkan.</li>
                        </ul>
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            icon={FileDown}
                            onClick={handleDownloadTemplate}
                        >
                            Download Template .xlsx
                        </Button>
                    </div>

                    <FormField label="File Excel" required>
                        <FileUpload
                            label="Pilih file Excel"
                            hint="Format: .xlsx atau .xls"
                            accept=".xlsx, .xls"
                            required
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                        />
                    </FormField>
                </form>
            </Modal>

            <Modal
                open={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail User"
                subtitle="Informasi lengkap akun"
                icon={UserIcon}
                size="lg"
                footer={
                    <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                        Tutup
                    </Button>
                }
            >
                {isFetchingDetail ? (
                    <div className="text-center py-10 font-bold">Mengambil data...</div>
                ) : detailUser && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
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
                                        <p className="text-xl font-black text-[#5A2EFF]">{getUserPoints(detailUser)}</p>
                                    </div>
                                    <div className="bg-white/95 rounded-xl p-3 text-center">
                                        <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">EXP</p>
                                        <p className="text-xl font-black text-orange-500">{getUserXp(detailUser)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-5 -right-5 opacity-20"><Flame className="w-24 h-24" /></div>
                        </div>

                        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-sm mb-4 flex items-center">
                                <Activity className="w-4 h-4 text-[#5A2EFF] mr-2" />
                                Riwayat Aktivitas
                            </h3>
                            {detailActivities.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-6">Belum ada aktivitas.</p>
                            ) : (
                                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                    {detailActivities.map((activity) => {
                                        const status = (activity.status ?? 'UNKNOWN').toUpperCase();
                                        const isEvent = (activity.submission_scope ?? '').toUpperCase() === 'EVENT';
                                        return (
                                            <button
                                                key={activity.id}
                                                type="button"
                                                onClick={() => setSelectedActivityDetail(activity)}
                                                className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-gray-800">{activity.type}</p>
                                                        {isEvent && activity.event_name && (
                                                            <p className="text-[11px] font-semibold text-[#5A2EFF] mt-1">
                                                                Event: {activity.event_name}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {activity.date} · {activity.distance_km} km · {activity.duration_minutes} mnt
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                                        status === 'APPROVED'
                                                            ? 'bg-green-50 text-green-600'
                                                            : status === 'REJECTED'
                                                                ? 'bg-red-50 text-red-600'
                                                                : 'bg-yellow-50 text-yellow-700'
                                                    }`}>
                                                        {status}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {detailActivitiesTotalPages > 1 && detailUser && (
                                <div className="flex items-center justify-center gap-3 mt-4">
                                    <button
                                        type="button"
                                        disabled={detailActivitiesPage <= 1}
                                        onClick={() => fetchDetailActivities(detailUser.id, detailActivitiesPage - 1)}
                                        className="px-3 py-1 rounded-md border border-gray-200 disabled:opacity-40"
                                    >
                                        Prev
                                    </button>
                                    <span className="text-sm text-gray-500">{detailActivitiesPage} / {detailActivitiesTotalPages}</span>
                                    <button
                                        type="button"
                                        disabled={detailActivitiesPage >= detailActivitiesTotalPages}
                                        onClick={() => fetchDetailActivities(detailUser.id, detailActivitiesPage + 1)}
                                        className="px-3 py-1 rounded-md border border-gray-200 disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                open={!!selectedActivityDetail}
                onClose={() => setSelectedActivityDetail(null)}
                title="Detail Aktivitas"
                icon={Activity}
                size="md"
                footer={
                    <Button variant="secondary" onClick={() => setSelectedActivityDetail(null)}>
                        Tutup
                    </Button>
                }
            >
                {selectedActivityDetail && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-gray-500 block text-xs">Tipe</span><strong>{selectedActivityDetail.type}</strong></div>
                            <div><span className="text-gray-500 block text-xs">Tanggal</span><strong>{selectedActivityDetail.date}</strong></div>
                            <div><span className="text-gray-500 block text-xs">Jarak</span><strong>{selectedActivityDetail.distance_km} km</strong></div>
                            <div><span className="text-gray-500 block text-xs">Durasi</span><strong>{selectedActivityDetail.duration_minutes} mnt</strong></div>
                            <div><span className="text-gray-500 block text-xs">Status</span><strong>{selectedActivityDetail.status}</strong></div>
                            {selectedActivityDetail.event_name && (
                                <div><span className="text-gray-500 block text-xs">Event</span><strong>{selectedActivityDetail.event_name}</strong></div>
                            )}
                        </div>
                        {selectedActivityDetail.source_link && (
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">Link Aktivitas</span>
                                <a
                                    href={selectedActivityDetail.source_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#5A2EFF] underline break-all text-sm"
                                >
                                    {selectedActivityDetail.source_link}
                                </a>
                            </div>
                        )}
                        {selectedActivityDetail.review_note && (
                            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
                                <span className="text-gray-500 block text-xs mb-1">Catatan Review</span>
                                {selectedActivityDetail.review_note}
                            </div>
                        )}
                        {selectedActivityDetail.proof_photo && (
                            <div>
                                <span className="text-gray-500 block text-xs mb-2">Bukti Foto</span>
                                <img
                                    src={selectedActivityDetail.proof_photo}
                                    alt="Bukti aktivitas"
                                    className="w-full max-h-64 object-cover rounded-xl border border-gray-100"
                                />
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <Modal
                open={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit User"
                icon={Edit}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" className="flex-1" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" form="edit-user-form" variant="primary" className="flex-1" loading={isSubmitting}>
                            Simpan Perubahan
                        </Button>
                    </>
                }
            >
                <form id="edit-user-form" onSubmit={handleEditSubmit} className="admin-form space-y-4">
                    <FormField label="Nama User / Username" required>
                        <Input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Phone Number">
                        <Input
                            type="tel"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Perusahaan" optional>
                        <Select
                            value={formData.company_id}
                            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                        >
                            <option value="">Pilih Perusahaan (Opsional)...</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>{company.name}</option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="Departemen" required>
                        <Select
                            required
                            value={formData.department_id}
                            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                        >
                            <option value="" disabled>Pilih Departemen...</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="Role">
                        <Select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="participant">Participant</option>
                            <option value="admin">Admin</option>
                        </Select>
                    </FormField>
                    <FormField label="Status">
                        <Select
                            value={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </Select>
                    </FormField>
                </form>
            </Modal>

            <ConfirmModal
                open={isDeleteModalOpen && !!userToDelete}
                onClose={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
                onConfirm={executeDelete}
                title="Hapus User?"
                description={`Anda akan menghapus user "${userToDelete?.fullName}". Semua histori poin dan aktivitasnya akan ikut terhapus secara permanen.`}
                confirmLabel="Ya, Hapus"
                loading={isSubmitting}
            />

        </div>
    );
}