import { useState, useEffect } from 'react';
import {
    Activity, Clock, Calendar, Link as LinkIcon,
    ChevronLeft, ChevronRight, Check, User, Ruler,
    ExternalLink, ZoomIn, FileText, AlertTriangle, CheckCircle2,
    ClipboardList, Image as ImageIcon
} from 'lucide-react';
import {
    PageHeader, Button, Modal, FormField, Textarea, Toast
} from '../components/ui';
import { getBaseUrl } from '../utils/apiConfig';

export default function SubmissionsPage() {
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [dashboardSummary, setDashboardSummary] = useState(null);

    // STATE UNTUK MODAL DETAIL & ZOOM
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [reviewNote, setReviewNote] = useState('');
    const [toastMessage, setToastMessage] = useState('');

    const [confirmAction, setConfirmAction] = useState(null);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const statusQuery = activeTab === 'All' ? '' : `&status=${activeTab.toLowerCase()}`;

            const response = await fetch(`${getBaseUrl()}/admin/activity-submissions?page=${currentPage}&limit=10${statusQuery}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                const items = json.data.items || [];
                setSubmissions(items);

                if (json.data.pagination) {
                    setTotalPages(json.data.pagination.totalPages);
                    setTotalData(json.data.pagination.totalItems);
                } else {
                    setTotalData(items.length);
                }
            }
        } catch (error) {
            console.error("Gagal mengambil data submissions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDashboardSummary = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/dashboard?range=7d`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.status === 'success') {
                setDashboardSummary(json.data.summary);
            }
        } catch (error) {
            console.error("Gagal mengambil summary dashboard");
        }
    };

    // Fungsi Eksekusi API (Dijalankan SETELAH konfirmasi)
    const executeVerification = async () => {
        if (!selectedSubmission || !confirmAction) return;

        if (confirmAction === 'rejected' && !reviewNote.trim()) {
            setToastMessage('Catatan penolakan wajib diisi sebelum menolak aktivitas.');
            setConfirmAction(null);
            return;
        }

        setIsVerifying(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/activity-submissions/${selectedSubmission.id}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: confirmAction,
                    review_note: reviewNote || (confirmAction === 'approved' ? "Telah diverifikasi oleh Admin." : "")
                })
            });

            const json = await response.json();

            if (json.success || json.status === 'success') {
                closeModal();
                fetchSubmissions();
                fetchDashboardSummary();
            } else {
                setToastMessage(json.message || 'Gagal melakukan verifikasi');
            }
        } catch (error) {
            setToastMessage('Terjadi kesalahan jaringan.');
        } finally {
            setIsVerifying(false);
            setConfirmAction(null);
        }
    };

    const closeModal = () => {
        setSelectedSubmission(null);
        setReviewNote('');
        setConfirmAction(null);
    };

    useEffect(() => {
        fetchSubmissions();
    }, [activeTab, currentPage]);

    useEffect(() => {
        fetchDashboardSummary();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
    };

    const getStatusStyle = (status) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'bg-orange-50 text-orange-600';
            case 'APPROVED': return 'bg-green-50 text-green-600';
            case 'REJECTED': return 'bg-red-50 text-red-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    const formatDuration = (minutes, seconds) => {
        if (seconds != null && seconds > 0) {
            return `${minutes} menit ${seconds} detik`;
        }
        return `${minutes ?? 0} menit`;
    };

    const formatPace = (pace) => {
        if (pace == null || pace === '') return null;
        return `${pace} min/km`;
    };

    return (
        <div className="space-y-6">
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />

            <PageHeader
                title="Pengajuan Aktivitas"
                subtitle="Review dan atur submissions user"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#5A2EFF] mb-4">
                        <Activity className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">
                        {activeTab === 'All' ? 'Total Keseluruhan' : `Total Tab ${activeTab}`}
                    </p>
                    <h3 className="text-3xl font-extrabold text-[#5A2EFF]">{totalData}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                        <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Menunggu validasi (Global)</p>
                    <h3 className="text-3xl font-extrabold text-orange-600">
                        {dashboardSummary ? dashboardSummary.pending_submissions.value : '-'}
                    </h3>
                </div>
            </div>

            {/* TABS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
                <div className="bg-[#F3F4F6] p-1 rounded-xl flex space-x-1 inline-flex">
                    {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-[#5A2EFF] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                {/* <div className="flex space-x-3">
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50">
                        <Filter className="w-4 h-4 mr-2" /> Advanced Filter
                    </button>
                </div> */}
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F9FAFB] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">No.</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nama Peserta</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tipe Aktivitas</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tanggal Aktivitas</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Jarak / Durasi</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Waktu Submit</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="8" className="text-center py-10 text-gray-500 font-medium">Memuat data...</td></tr>
                            ) : submissions.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-10 text-gray-500 font-medium">Tidak ada data submission.</td></tr>
                            ) : (
                                submissions.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800">{((currentPage - 1) * 10) + index + 1}</td>
                                        <td className="px-6 py-4 flex items-center space-x-3">
                                            {/* <img src={`https://ui-avatars.com/api/?name=${item.participant_name}&background=random`} alt="Avatar" className="w-8 h-8 rounded-full" /> */}
                                            <span className="font-bold text-gray-800">{item.participant_name}</span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-700">{item.activity_type}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs font-medium">{item.activity_date ? formatDate(item.activity_date) : '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{item.distance_km} km</div>
                                            <div className="text-xs text-gray-500">
                                                {formatDuration(item.duration_minutes, item.duration_seconds)}
                                            </div>
                                            {formatPace(item.pace_min_per_km) && (
                                                <div className="text-xs text-[#5A2EFF] font-semibold mt-0.5">
                                                    Pace: {formatPace(item.pace_min_per_km)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${getStatusStyle(item.status)}`}>{item.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs font-medium">{formatDate(item.submitted_at)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setSelectedSubmission(item)}
                                            >
                                                Detail
                                            </Button>
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
                        Showing {submissions.length > 0 ? ((currentPage - 1) * 10) + 1 : 0}-
                        {Math.min(currentPage * 10, totalData)} of {totalData} results
                    </p>
                    <div className="flex space-x-1">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#5A2EFF] text-white font-bold text-sm">{currentPage}</button>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* ========================================= */}
            {/* 1. OVERLAY ZOOM GAMBAR (z-index 60)         */}
            {/* ========================================= */}
            {isZoomed && selectedSubmission?.proof_photo && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out p-4 animate-in fade-in duration-200"
                    onClick={() => setIsZoomed(false)}
                >
                    <img src={selectedSubmission.proof_photo} alt="Zoomed Bukti" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
                    <div className="absolute top-6 right-6 text-white font-bold bg-black/50 px-4 py-2 rounded-full pointer-events-none">Klik di mana saja untuk menutup</div>
                </div>
            )}

            <Modal
                open={!!selectedSubmission}
                onClose={closeModal}
                title="Detail Submission"
                subtitle="Review activity pengguna sebelum approval"
                icon={ClipboardList}
                size="full"
                className="max-w-[900px]"
                footer={
                    selectedSubmission?.status.toUpperCase() === 'PENDING' ? (
                        <>
                            <p className="hidden flex-1 text-xs font-medium leading-relaxed text-gray-500 md:block">
                                Pastikan semua detil hasil submit cocok dengan bukti gambar sebelum mengambil keputusan
                            </p>
                            <Button variant="danger" icon={AlertTriangle} onClick={() => setConfirmAction('rejected')}>
                                Reject
                            </Button>
                            <Button variant="success" icon={Check} onClick={() => setConfirmAction('approved')}>
                                Approve
                            </Button>
                        </>
                    ) : (
                        <Button variant="secondary" className="ml-auto" onClick={closeModal}>
                            Tutup
                        </Button>
                    )
                }
            >
                {selectedSubmission && (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-gray-100 bg-[#F8F9FC] p-5 shadow-sm">
                                <h3 className="mb-4 flex items-center text-sm font-bold text-gray-900">
                                    <Activity className="mr-2 h-4 w-4 text-[#5A2EFF]" /> Activity Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Nama Peserta">
                                        <div className="flex items-center rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                                            <User className="mr-2.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <span className="truncate text-sm font-semibold text-gray-800">{selectedSubmission.participant_name}</span>
                                        </div>
                                    </FormField>
                                    <FormField label="Status">
                                        <div className="flex items-center rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                                            <Clock className="mr-2.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <span className="text-sm font-bold uppercase text-gray-800">{selectedSubmission.status}</span>
                                        </div>
                                    </FormField>
                                    <FormField label="Aktifitas">
                                        <div className="flex items-center rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                                            <Activity className="mr-2.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <span className="truncate text-sm font-semibold text-gray-800">{selectedSubmission.activity_type}</span>
                                        </div>
                                    </FormField>
                                    <FormField label="Tanggal Aktivitas">
                                        <div className="flex items-center rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                                            <Calendar className="mr-2.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <span className="text-sm font-semibold text-gray-800">{selectedSubmission.activity_date ? formatDate(selectedSubmission.activity_date) : '-'}</span>
                                        </div>
                                    </FormField>
                                    <FormField label="Jarak (km)">
                                        <div className="flex items-center rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                                            <Ruler className="mr-2.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <span className="text-sm font-semibold text-gray-800">{selectedSubmission.distance_km}</span>
                                        </div>
                                    </FormField>
                                    <FormField label="Durasi">
                                        <div className="flex items-center rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                                            <Clock className="mr-2.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <span className="text-sm font-semibold text-gray-800">
                                                {formatDuration(selectedSubmission.duration_minutes, selectedSubmission.duration_seconds)}
                                            </span>
                                        </div>
                                    </FormField>
                                    {formatPace(selectedSubmission.pace_min_per_km) && (
                                        <FormField label="Pace">
                                            <div className="flex items-center rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                                                <Activity className="mr-2.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                                <span className="text-sm font-semibold text-gray-800">{formatPace(selectedSubmission.pace_min_per_km)}</span>
                                            </div>
                                        </FormField>
                                    )}
                                    <FormField label="Waktu Submit">
                                        <div className="flex items-center rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                                            <Calendar className="mr-2.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-800">
                                                {formatDate(selectedSubmission.submitted_at)}
                                            </span>
                                        </div>
                                    </FormField>
                                    <FormField label="Sumber" className="col-span-2">
                                        <div className="flex items-center rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                                            <LinkIcon className="mr-2.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <a href={selectedSubmission.source_link} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm font-semibold text-gray-800 hover:text-[#5A2EFF]">
                                                {selectedSubmission.source_link}
                                            </a>
                                            <ExternalLink className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                        </div>
                                    </FormField>
                                </div>
                            </div>

                            {selectedSubmission.status.toUpperCase() === 'PENDING' ? (
                                <FormField label="Catatan Verifikasi Admin" optional hint="Opsional — wajib diisi jika menolak aktivitas">
                                    <Textarea
                                        rows={3}
                                        placeholder="Ketik catatan di sini..."
                                        value={reviewNote}
                                        onChange={(e) => setReviewNote(e.target.value)}
                                    />
                                </FormField>
                            ) : (
                                <FormField label="Catatan Verifikasi Admin">
                                    <div className="flex items-start rounded-xl border border-gray-200 bg-white px-3.5 py-3 shadow-sm">
                                        <FileText className="mr-2.5 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                        <span className="text-sm font-medium italic text-gray-700">
                                            {selectedSubmission.review_note || 'Tidak ada catatan.'}
                                        </span>
                                    </div>
                                </FormField>
                            )}
                        </div>

                        <div className="flex flex-col rounded-2xl border border-gray-100 bg-[#F8F9FC] p-5 shadow-sm">
                            <h3 className="mb-4 flex items-center text-sm font-bold text-gray-900">
                                <ImageIcon className="mr-2 h-4 w-4 text-[#5A2EFF]" /> Bukti Foto
                            </h3>
                            <div
                                className="relative flex flex-1 cursor-zoom-in items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-inner"
                                onClick={() => selectedSubmission.proof_photo && setIsZoomed(true)}
                            >
                                {selectedSubmission.proof_photo ? (
                                    <>
                                        <img src={selectedSubmission.proof_photo} alt="Bukti" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 hover:bg-black/30">
                                            <ZoomIn className="h-10 w-10 scale-50 text-white opacity-0 drop-shadow-lg transition-all duration-300 hover:scale-100 hover:opacity-100" />
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm font-medium text-gray-400">Tidak ada foto bukti</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                open={!!confirmAction && !!selectedSubmission}
                onClose={() => !isVerifying && setConfirmAction(null)}
                title={confirmAction === 'approved' ? 'Setujui Aktivitas?' : 'Tolak Aktivitas?'}
                icon={confirmAction === 'approved' ? CheckCircle2 : AlertTriangle}
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" className="flex-1" onClick={() => setConfirmAction(null)} disabled={isVerifying}>
                            Kembali
                        </Button>
                        <Button
                            variant={confirmAction === 'approved' ? 'success' : 'danger'}
                            className="flex-1"
                            onClick={executeVerification}
                            loading={isVerifying}
                        >
                            Ya, Lanjutkan
                        </Button>
                    </>
                }
            >
                <p className="text-sm leading-relaxed text-gray-500">
                    {confirmAction === 'approved'
                        ? `Anda akan menyetujui aktivitas dari ${selectedSubmission?.participant_name}. Sistem akan menambahkan Poin & EXP secara otomatis. Tindakan ini tidak dapat dibatalkan.`
                        : 'Anda akan menolak pengajuan aktivitas ini. Pengguna tidak akan mendapatkan Poin & EXP. Tindakan ini tidak dapat dibatalkan.'}
                </p>
            </Modal>
        </div>
    );
}