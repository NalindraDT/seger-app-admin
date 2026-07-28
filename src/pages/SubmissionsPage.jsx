import { useState, useEffect } from 'react';
import {
    Activity, Clock, ChevronLeft, ChevronRight, Check,
    AlertTriangle, CheckCircle2, ClipboardList
} from 'lucide-react';
import {
    PageHeader, Button, Modal, Toast
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
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-800">{item.participant_name}</span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-700">{item.activity_type}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs font-medium">{item.activity_date ? formatDate(item.activity_date) : '-'}</td>
                                        <td className="px-6 py-4">
                                            {item.input_fields && item.input_fields.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {item.input_fields.map((field) => {
                                                        const val = item.submission_data?.[field.key];
                                                        return (
                                                            <div key={field.key} className="text-xs text-gray-700">
                                                                <span className="font-semibold">{field.label}:</span>{' '}
                                                                {val != null ? val : '-'}
                                                                {field.unit ? ` ${field.unit}` : ''}
                                                            </div>
                                                        );
                                                    })}
                                                    {item.computed_metrics && Object.keys(item.computed_metrics).length > 0 && (
                                                        <div className="text-xs text-[#5A2EFF] font-semibold mt-1">
                                                            {item.output_metrics?.map((m) => {
                                                                const v = item.computed_metrics?.[m.key];
                                                                return v != null ? `${m.label}: ${v} ${m.unit}` : null;
                                                            }).filter(Boolean).join(' • ')}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="font-bold text-gray-800">{item.distance_km} km</div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDuration(item.duration_minutes, item.duration_seconds)}
                                                    </div>
                                                    {formatPace(item.pace_min_per_km) && (
                                                        <div className="text-xs text-[#5A2EFF] font-semibold mt-0.5">
                                                            Pace: {formatPace(item.pace_min_per_km)}
                                                        </div>
                                                    )}
                                                </>
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
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-5">
                            <div className="rounded-xl bg-gray-50 p-5">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-400 text-xs">Nama Peserta</span>
                                        <p className="font-semibold text-gray-900 truncate">{selectedSubmission.participant_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs">Status</span>
                                        <p className="font-bold uppercase text-gray-900">{selectedSubmission.status}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs">Aktivitas</span>
                                        <p className="font-semibold text-gray-900 truncate">{selectedSubmission.activity_type}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs">Tanggal Aktivitas</span>
                                        <p className="font-semibold text-gray-900">{selectedSubmission.activity_date ? formatDate(selectedSubmission.activity_date) : '-'}</p>
                                    </div>
                                    {(!selectedSubmission.input_fields || selectedSubmission.input_fields.length === 0) && (
                                        <>
                                            <div>
                                                <span className="text-gray-400 text-xs">Jarak</span>
                                                <p className="font-semibold text-gray-900">{selectedSubmission.distance_km} km</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 text-xs">Durasi</span>
                                                <p className="font-semibold text-gray-900">
                                                    {formatDuration(selectedSubmission.duration_minutes, selectedSubmission.duration_seconds)}
                                                </p>
                                            </div>
                                            {formatPace(selectedSubmission.pace_min_per_km) && (
                                                <div>
                                                    <span className="text-gray-400 text-xs">Pace</span>
                                                    <p className="font-semibold text-[#5A2EFF]">{formatPace(selectedSubmission.pace_min_per_km)}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div>
                                        <span className="text-gray-400 text-xs">Waktu Submit</span>
                                        <p className="font-semibold text-gray-900">{formatDate(selectedSubmission.submitted_at)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-400 text-xs">Sumber</span>
                                        <p className="font-semibold text-gray-900 truncate">
                                            {selectedSubmission.source_link ? (
                                                <a href={selectedSubmission.source_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                    {selectedSubmission.source_link}
                                                </a>
                                            ) : '-'}
                                        </p>
                                    </div>
                                </div>

                                {selectedSubmission.input_fields && selectedSubmission.input_fields.length > 0 && (
                                    <>
                                        <hr className="my-4 border-gray-200" />
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Input Parameter</h4>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                            {selectedSubmission.input_fields.map((field) => {
                                                const value = selectedSubmission.submission_data?.[field.key];
                                                return (
                                                    <div key={field.key}>
                                                        <span className="text-gray-400 text-xs">{field.label}{field.unit ? ` (${field.unit})` : ''}</span>
                                                        <p className="font-semibold text-gray-900">{value != null ? value : '-'}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {selectedSubmission.computed_metrics && Object.keys(selectedSubmission.computed_metrics).length > 0 && (
                                    <>
                                        <hr className="my-4 border-gray-200" />
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Output Metrik</h4>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                            {selectedSubmission.output_metrics?.map((metric) => {
                                                const value = selectedSubmission.computed_metrics?.[metric.key];
                                                return (
                                                    <div key={metric.key}>
                                                        <span className="text-gray-400 text-xs">{metric.label} ({metric.unit})</span>
                                                        <p className="font-semibold text-[#5A2EFF]">{value != null ? value : '-'}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>

                            {selectedSubmission.status.toUpperCase() === 'PENDING' ? (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Catatan Verifikasi Admin</label>
                                    <p className="text-xs text-gray-400 mb-2">Opsional — wajib diisi jika menolak aktivitas</p>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]/20 focus:border-[#5A2EFF]"
                                        placeholder="Ketik catatan di sini..."
                                        value={reviewNote}
                                        onChange={(e) => setReviewNote(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Catatan Verifikasi Admin</span>
                                    <p className="mt-1.5 text-sm italic text-gray-600 bg-gray-50 rounded-lg px-3.5 py-2.5">
                                        {selectedSubmission.review_note || 'Tidak ada catatan.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col rounded-xl bg-gray-50 p-5">
                            <h3 className="mb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Bukti Foto</h3>
                            <div
                                className="relative flex flex-1 cursor-zoom-in items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white"
                                onClick={() => selectedSubmission.proof_photo && setIsZoomed(true)}
                            >
                                {selectedSubmission.proof_photo ? (
                                    <img src={selectedSubmission.proof_photo} alt="Bukti" className="h-full w-full object-cover" />
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