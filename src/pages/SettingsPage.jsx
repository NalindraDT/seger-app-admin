import { useState, useEffect, useRef } from 'react';
import {
    Settings, Edit, Target, Coins, ShieldAlert, Download, Upload, Database
} from 'lucide-react';
import {
    FormField, Input, Button, Modal, Toast, PageHeader, ConfirmModal
} from '../components/ui';
import { getBaseUrl } from '../utils/apiConfig';

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const [settingsData, setSettingsData] = useState(null);

    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

    const [isExportingBackup, setIsExportingBackup] = useState(false);
    const [isRestoringBackup, setIsRestoringBackup] = useState(false);
    const [backupFile, setBackupFile] = useState(null);
    const backupInputRef = useRef(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        max_point_earning_activities_per_day: '',
        max_points_per_day: ''
    });

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');

            const limitResponse = await fetch(`${getBaseUrl()}/admin/settings/activity-claim-limit`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const limitJson = await limitResponse.json();

            if (limitJson.status === 'success') {
                setSettingsData(limitJson.data);
            }

            const maintenanceResponse = await fetch(`${getBaseUrl()}/admin/settings/maintenance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const maintenanceJson = await maintenanceResponse.json();

            if (maintenanceJson.status === 'success') {
                setIsMaintenance(maintenanceJson.data.is_maintenance);
            }

        } catch (error) {
            console.error("Gagal mengambil data pengaturan", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const openEditModal = () => {
        setFormData({
            max_point_earning_activities_per_day: settingsData?.max_point_earning_activities_per_day || '',
            max_points_per_day: settingsData?.max_points_per_day || ''
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
    };

    const handleSubmitLimit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('jwt_token');
            const payload = {
                max_point_earning_activities_per_day: Number(formData.max_point_earning_activities_per_day),
                max_points_per_day: Number(formData.max_points_per_day)
            };

            const response = await fetch(`${getBaseUrl()}/admin/settings/activity-claim-limit`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const json = await response.json();

            if (json.status === 'success' || json.success) {
                showToast('Pengaturan limit berhasil diperbarui!');
                closeEditModal();
                fetchSettings();
            } else {
                alert(json.message || "Terjadi kesalahan saat menyimpan pengaturan.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleExportBackup = async () => {
        setIsExportingBackup(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/backup/export`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorJson = await response.json().catch(() => null);
                throw new Error(errorJson?.error?.message || errorJson?.message || 'Gagal membuat backup.');
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition') || '';
            const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
            const fileName = fileNameMatch?.[1] || `seger-backup-${new Date().toISOString().slice(0, 10)}.zip`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showToast('Backup berhasil diunduh!');
        } catch (error) {
            alert(error.message || 'Terjadi kesalahan saat membuat backup.');
        } finally {
            setIsExportingBackup(false);
        }
    };

    const handleBackupFileChange = (event) => {
        const file = event.target.files?.[0] ?? null;
        setBackupFile(file);
    };

    const handleRestoreClick = () => {
        if (!backupFile) {
            alert('Pilih file backup (.zip) terlebih dahulu.');
            return;
        }
        setIsRestoreConfirmOpen(true);
    };

    const executeRestoreBackup = async () => {
        if (!backupFile) return;

        setIsRestoringBackup(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const formData = new FormData();
            formData.append('backup', backupFile);

            const response = await fetch(`${getBaseUrl()}/admin/backup/restore`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const json = await response.json();

            if (json.status === 'success' || json.success) {
                showToast(`Restore berhasil! ${json.data?.restoredFiles ?? 0} file dipulihkan.`);
                setBackupFile(null);
                if (backupInputRef.current) {
                    backupInputRef.current.value = '';
                }
                fetchSettings();
            } else {
                alert(json.error?.message || json.message || 'Gagal melakukan restore backup.');
            }
        } catch (error) {
            alert('Terjadi kesalahan jaringan saat restore backup.');
        } finally {
            setIsRestoringBackup(false);
            setIsRestoreConfirmOpen(false);
        }
    };

    const executeToggleMaintenance = async () => {
        const targetState = !isMaintenance;
        setIsTogglingMaintenance(true);

        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/settings/maintenance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_maintenance: targetState })
            });

            const json = await response.json();

            if (json.status === 'success' || json.success) {
                setIsMaintenance(targetState);
                showToast(targetState ? 'Mode Perbaikan Aktif!' : 'Mode Perbaikan Dimatikan!');
            } else {
                alert(json.message || "Gagal mengubah status maintenance.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan saat mengubah status maintenance.");
        } finally {
            setIsTogglingMaintenance(false);
            setIsConfirmModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />

            <PageHeader
                title="Pengaturan Aplikasi"
                subtitle="Konfigurasi parameter dan batasan utama sistem"
            />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#5A2EFF] border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-bold text-gray-500">Memuat pengaturan...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-5 flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#5A2EFF]">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Limit Harian</h3>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Keamanan Poin</p>
                                </div>
                            </div>
                            <button
                                onClick={openEditModal}
                                className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors"
                                title="Edit Limit"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 pb-5 flex-1 flex flex-col justify-end">
                            <div className="bg-[#F8F9FC] rounded-xl p-4 grid grid-cols-2 gap-3 border border-gray-100">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold mb-1">MAKS. AKTIVITAS</p>
                                    <div className="flex items-baseline space-x-1">
                                        <span className="text-xl font-black text-gray-900">{settingsData?.max_point_earning_activities_per_day}</span>
                                        <span className="text-xs text-gray-500 font-medium">kali/hari</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold mb-1">MAKS. POIN</p>
                                    <div className="flex items-baseline space-x-1">
                                        <span className="text-xl font-black text-gray-900">{settingsData?.max_points_per_day}</span>
                                        <span className="text-xs text-gray-500 font-medium">poin/hari</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
                        {isMaintenance && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>}

                        <div className="p-5 flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isMaintenance ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                                    <Settings className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Mode Perbaikan</h3>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Kill Switch</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 pb-5 flex-1 flex flex-col justify-end">
                            <div className={`rounded-xl p-4 border flex items-center justify-between transition-colors ${isMaintenance ? 'bg-red-50 border-red-100' : 'bg-[#F8F9FC] border-gray-100'}`}>
                                <div>
                                    <p className={`text-xs font-bold mb-1 ${isMaintenance ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isMaintenance ? 'SEDANG AKTIF' : 'NONAKTIF'}
                                    </p>
                                    <p className={`text-[10px] max-w-[150px] ${isMaintenance ? 'text-red-500' : 'text-gray-500'}`}>
                                        {isMaintenance ? 'Semua API terkunci. User tidak bisa akses aplikasi.' : 'Aplikasi berjalan normal.'}
                                    </p>
                                </div>

                                <button
                                    onClick={handleToggleClick}
                                    disabled={isTogglingMaintenance}
                                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5A2EFF] focus-visible:ring-offset-2 ${isMaintenance ? 'bg-red-500' : 'bg-gray-300'} ${isTogglingMaintenance ? 'opacity-50 cursor-wait' : ''}`}
                                    role="switch"
                                    aria-checked={isMaintenance}
                                >
                                    <span className="sr-only">Toggle Maintenance Mode</span>
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMaintenance ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:col-span-2 lg:col-span-1">
                        <div className="p-5 flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Backup & Restore</h3>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Database & File Upload</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 pb-5 flex-1 flex flex-col justify-end space-y-3">
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Backup mencakup seluruh data database dan file yang diunggah ke storage. File backup berformat <span className="font-bold">.zip</span>.
                            </p>

                            <Button
                                variant="primary"
                                className="w-full"
                                icon={Download}
                                loading={isExportingBackup}
                                onClick={handleExportBackup}
                            >
                                Unduh Backup (ZIP)
                            </Button>

                            <div className="rounded-xl border border-dashed border-gray-200 bg-[#F8F9FC] p-3 space-y-3">
                                <input
                                    ref={backupInputRef}
                                    type="file"
                                    accept=".zip,application/zip"
                                    onChange={handleBackupFileChange}
                                    className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#5A2EFF] hover:file:bg-indigo-50"
                                />
                                {backupFile && (
                                    <p className="text-[10px] font-medium text-gray-600 truncate">
                                        File dipilih: {backupFile.name}
                                    </p>
                                )}
                                <Button
                                    variant="danger"
                                    className="w-full"
                                    icon={Upload}
                                    loading={isRestoringBackup}
                                    disabled={!backupFile}
                                    onClick={handleRestoreClick}
                                >
                                    Restore dari ZIP
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                open={isEditModalOpen}
                onClose={closeEditModal}
                title="Edit Limit Harian"
                subtitle="Atur batas aktivitas dan poin harian"
                icon={ShieldAlert}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" className="flex-1" onClick={closeEditModal} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" form="limit-form" variant="success" className="flex-1" loading={isSubmitting}>
                            Simpan
                        </Button>
                    </>
                }
            >
                <form id="limit-form" onSubmit={handleSubmitLimit} className="admin-form space-y-4">
                    <FormField
                        label="Batas Jumlah Aktivitas"
                        required
                        hint="Maksimal user bisa claim poin dalam 1 hari."
                    >
                        <Input
                            icon={Target}
                            type="number"
                            min="0"
                            required
                            value={formData.max_point_earning_activities_per_day}
                            onChange={(e) => setFormData({ ...formData, max_point_earning_activities_per_day: e.target.value })}
                        />
                    </FormField>

                    <FormField
                        label="Batas Total Poin"
                        required
                        hint="Batas absolut poin yang dikumpulkan per hari."
                    >
                        <Input
                            icon={Coins}
                            type="number"
                            min="0"
                            required
                            value={formData.max_points_per_day}
                            onChange={(e) => setFormData({ ...formData, max_points_per_day: e.target.value })}
                        />
                    </FormField>
                </form>
            </Modal>

            <ConfirmModal
                open={isRestoreConfirmOpen}
                onClose={() => setIsRestoreConfirmOpen(false)}
                onConfirm={executeRestoreBackup}
                title="Restore Backup?"
                description="Tindakan ini akan menimpa seluruh data database dan file upload saat ini dengan isi backup. Proses ini tidak dapat dibatalkan. Pastikan Anda sudah membuat backup terbaru sebelum melanjutkan."
                confirmLabel="Ya, Restore Sekarang"
                variant="danger"
                loading={isRestoringBackup}
            />

            <ConfirmModal
                open={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={executeToggleMaintenance}
                title={!isMaintenance ? 'Aktifkan Mode Perbaikan?' : 'Matikan Mode Perbaikan?'}
                description={
                    !isMaintenance
                        ? 'Semua user (pengguna mobile) akan langsung dikeluarkan dan tidak bisa mengakses aplikasi hingga mode ini dimatikan kembali.'
                        : 'Aplikasi akan kembali berjalan normal dan user dapat melakukan aktivitas seperti biasa.'
                }
                confirmLabel="Ya, Lanjutkan"
                variant={!isMaintenance ? 'danger' : 'success'}
                loading={isTogglingMaintenance}
            />
        </div>
    );
}
