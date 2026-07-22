import { useState, useEffect } from 'react';
import {
    Search, Plus, Edit,
    X, Activity, ChevronDown, CheckCircle2, Trash2, AlertTriangle
} from 'lucide-react';
import { getBaseUrl } from '../utils/apiConfig';

export default function ActivityTypesPage() {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // STATE MODAL & NOTIFIKASI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedId, setSelectedId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // STATE KHUSUS DELETE (2-Step Verification)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

    const [formData, setFormData] = useState({ code: '', name: '', is_active: true });

    const fetchActivities = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/activity-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) setActivities(json.data);
        } catch (error) {
            console.error("Gagal mengambil data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // FUNGSI CRUD
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const url = modalMode === 'add'
                ? `${getBaseUrl()}/admin/activity-types`
                : `${getBaseUrl()}/admin/activity-types/${selectedId}`;

            const response = await fetch(url, {
                method: modalMode === 'add' ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const json = await response.json();
            if (json.success || json.status === 'success') {
                closeModal();
                fetchActivities();
                showToast(modalMode === 'add' ? 'Tipe aktifitas berhasil ditambah!' : 'Tipe aktifitas berhasil diperbarui!');
            }
        } catch (error) {
            alert("Gagal memproses data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // FUNGSI EXECUTE DELETE (Step 2)
    const executeDelete = async () => {
        if (!activityToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/activity-types/${activityToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success || json.status === 'success') {
                setIsDeleteModalOpen(false);
                setActivityToDelete(null);
                fetchActivities();
                showToast('Tipe aktifitas berhasil dihapus!');
            }
        } catch (error) {
            alert("Gagal menghapus data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ code: '', name: '', is_active: true });
        setSelectedId(null);
    };

    const filteredActivities = activities.filter(activity =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 relative">

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-white border border-green-100 shadow-2xl rounded-xl p-4 flex items-center space-x-3 pr-6">
                        <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle2 className="w-5 h-5 text-[#10B981]" /></div>
                        <div>
                            <p className="text-sm font-extrabold text-gray-900">Berhasil!</p>
                            <p className="text-xs font-medium text-gray-500">{toastMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tipe Aktifitas</h1>
                <p className="text-sm text-gray-500 mt-1">Halaman pengaturan tipe aktifitas</p>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
                <div className="relative w-full sm:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
                    <input type="text" placeholder="Cari aktifitas" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FC] border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] focus:bg-white transition-all"
                    />
                </div>

                <button onClick={() => { setModalMode('add'); setIsModalOpen(true); }}
                    className="flex items-center justify-center px-4 py-2.5 bg-[#5A2EFF] text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" /> Tambah Aktifitas
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center w-16">No</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center w-32">Kode Aktifitas</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs">Nama Aktifitas</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center w-32">Status</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500 font-medium">Memuat data...</td></tr>
                            ) : (
                                filteredActivities.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800 text-center">{index + 1}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900 text-center">{item.code}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{item.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {item.is_active ? 'AKTIF' : 'NONAKTIF'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-center space-x-2">
                                            <button onClick={() => { setModalMode('edit'); setSelectedId(item.id); setFormData({ code: item.code, name: item.name, is_active: item.is_active }); setIsModalOpen(true); }} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => { setActivityToDelete(item); setIsDeleteModalOpen(true); }} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL (ADD / EDIT) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">{modalMode === 'add' ? 'Tambah Aktifitas' : 'Edit Aktifitas'}</h2>
                            <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Kode Aktifitas</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <div className="w-5 h-5 bg-gray-200 text-gray-500 rounded flex items-center justify-center text-[10px] font-bold border border-gray-300">Ad</div>
                                        </div>
                                        <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full pl-11 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Nama Aktifitas</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Activity className="w-4 h-4 text-gray-400" /></div>
                                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-11 pr-4 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
                                    <div className="relative">
                                        <select value={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                                            className="w-full pl-4 pr-10 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-gray-500" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* STYLING FOOTER BARU YANG KONSISTEN */}
                            <div className="px-6 py-5 border-t border-gray-100 bg-white flex space-x-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 px-4 py-3 rounded-xl text-white font-bold shadow-sm transition-colors disabled:opacity-50 ${modalMode === 'add' ? 'bg-[#5A2EFF] hover:bg-indigo-700' : 'bg-[#5A2EFF] hover:bg-indigo-700'}`}
                                >
                                    {isSubmitting ? 'Memproses...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DELETE (2-STEP VERIFICATION) */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Hapus Aktifitas?</h3>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Anda akan menghapus tipe aktifitas <span className="font-bold text-gray-800">"{activityToDelete?.name}"</span>. Pengguna tidak akan bisa memilih tipe ini lagi saat melakukan submission.
                        </p>
                        <div className="flex space-x-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50">Batal</button>
                            <button onClick={executeDelete} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50">
                                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}