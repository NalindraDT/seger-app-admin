import { useState, useEffect } from 'react';
import {
    Activity, Clock, Filter, Calendar, Link as LinkIcon,
    ChevronLeft, ChevronRight, X, Check, User, Ruler,
    ExternalLink, ZoomIn, FileText, AlertTriangle, CheckCircle2,
    ClipboardList, Image as ImageIcon // <--- INI YANG MEMBUATNYA CRASH, SUDAH DITAMBAHKAN
} from 'lucide-react';
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

    // STATE BARU UNTUK 2-STEP VERIFICATION (Konfirmasi)
    const [confirmAction, setConfirmAction] = useState(null); // 'approved' | 'rejected' | null

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
                    review_note: reviewNote || (confirmAction === 'approved' ? "Telah diverifikasi oleh Admin." : "Ditolak oleh Admin.")
                })
            });

            const json = await response.json();

            if (json.success || json.status === 'success') {
                closeModal();
                fetchSubmissions();
                fetchDashboardSummary();
            } else {
                alert(json.message || "Gagal melakukan verifikasi");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
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

    return (
        <div className="space-y-6">
            {/* HEADER & SUMMARY CARDS */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Pengajuan Aktivitas</h1>
                <p className="text-sm text-gray-500 mt-1">Review dan atur submissions user</p>
            </div>

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
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Jarak / Durasi</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Waktu Submit</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Memuat data...</td></tr>
                            ) : submissions.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Tidak ada data submission.</td></tr>
                            ) : (
                                submissions.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800">{((currentPage - 1) * 10) + index + 1}</td>
                                        <td className="px-6 py-4 flex items-center space-x-3">
                                            {/* <img src={`https://ui-avatars.com/api/?name=${item.participant_name}&background=random`} alt="Avatar" className="w-8 h-8 rounded-full" /> */}
                                            <span className="font-bold text-gray-800">{item.participant_name}</span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-700">{item.activity_type}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{item.distance_km} km</div>
                                            <div className="text-xs text-gray-500">{item.duration_minutes} menit</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${getStatusStyle(item.status)}`}>{item.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs font-medium">{formatDate(item.submitted_at)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedSubmission(item)}
                                                className="px-4 py-1.5 bg-[#F3F4F6] text-[#5A2EFF] border border-transparent font-bold text-xs rounded-md hover:bg-indigo-50 transition-all"
                                            >
                                                Detail
                                            </button>
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

            {/* ========================================= */}
            {/* 2. MODAL DETAIL UTAMA (z-index 50)          */}
            {/* ========================================= */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[900px] flex flex-col overflow-hidden border border-gray-100">

                        {/* HEADER MODAL SERAGAM */}
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                                    <ClipboardList className="w-5 h-5 text-[#5A2EFF]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-gray-900 leading-tight">Detail Submission</h2>
                                    <p className="text-[11px] font-medium text-gray-500">Review activity pengguna sebelum approval</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white overflow-y-auto max-h-[70vh]">

                            {/* KOLOM KIRI: Activity Information */}
                            <div className="space-y-6">
                                <div className="bg-[#F8F9FC] rounded-2xl p-5 border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center text-sm">
                                        <Activity className="w-4 h-4 text-[#5A2EFF] mr-2" /> Activity Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nama Peserta</label>
                                            <div className="flex items-center bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                                                <User className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-gray-800 truncate">{selectedSubmission.participant_name}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
                                            <div className="flex items-center bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                                                <Clock className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                                                <span className="text-sm font-bold uppercase text-gray-800">{selectedSubmission.status}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Aktifitas</label>
                                            <div className="flex items-center bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                                                <Activity className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-gray-800 truncate">{selectedSubmission.activity_type}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Jarak (km)</label>
                                            <div className="flex items-center bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                                                <Ruler className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-gray-800">{selectedSubmission.distance_km}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Durasi</label>
                                            <div className="flex items-center bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                                                <Clock className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-gray-800">{selectedSubmission.duration_minutes} min</span>
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Waktu Submit</label>
                                            <div className="flex items-center bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                                                <Calendar className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {formatDate(selectedSubmission.submitted_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Sumber</label>
                                            <div className="flex items-center bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                                                <LinkIcon className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                                                <a href={selectedSubmission.source_link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-gray-800 truncate hover:text-[#5A2EFF] flex-1">
                                                    {selectedSubmission.source_link}
                                                </a>
                                                <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SEKSI REVIEW NOTE */}
                                {selectedSubmission.status.toUpperCase() === 'PENDING' ? (
                                    <div className="bg-[#F8F9FC] rounded-2xl p-5 border border-gray-100 shadow-sm">
                                        <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Catatan Verifikasi Admin (Opsional)</label>
                                        <div className="relative">
                                            <div className="absolute top-3.5 left-3.5 text-gray-400 pointer-events-none">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <textarea
                                                rows="2"
                                                placeholder="Ketik catatan di sini..."
                                                value={reviewNote}
                                                onChange={(e) => setReviewNote(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-3.5 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] focus:border-transparent transition-all resize-none shadow-sm"
                                            ></textarea>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[#F8F9FC] rounded-2xl p-5 border border-gray-100 shadow-sm">
                                        <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Catatan Verifikasi Admin</label>
                                        <div className="flex items-start bg-white border border-gray-200 rounded-xl px-3.5 py-3 shadow-sm">
                                            <FileText className="w-4 h-4 text-gray-400 mr-2.5 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm font-medium text-gray-700 italic">
                                                {selectedSubmission.review_note || "Tidak ada catatan."}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* KOLOM KANAN: Bukti Foto */}
                            <div className="bg-[#F8F9FC] rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center text-sm">
                                    <ImageIcon className="w-4 h-4 text-[#5A2EFF] mr-2" /> Bukti Foto
                                </h3>
                                <div
                                    className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden relative group cursor-zoom-in flex items-center justify-center shadow-inner"
                                    onClick={() => setIsZoomed(true)}
                                >
                                    {selectedSubmission.proof_photo ? (
                                        <>
                                            <img src={selectedSubmission.proof_photo} alt="Bukti" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                                <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg scale-50 group-hover:scale-100 transition-all duration-300" />
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-400 text-sm font-medium">Tidak ada foto bukti</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer (Aksi Tahap 1) */}
                        <div className="px-8 py-5 border-t border-gray-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-xs font-medium text-gray-500 max-w-sm leading-relaxed">
                                Pastikan semua detil hasil submit cocok dengan bukti gambar sebelum mengambil keputusan
                            </p>

                            <div className="flex space-x-3 w-full md:w-auto">
                                {selectedSubmission.status.toUpperCase() === 'PENDING' ? (
                                    <>
                                        <button
                                            onClick={() => setConfirmAction('rejected')} // TRIGGER KONFIRMASI (2-STEP)
                                            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center"
                                        >
                                            <X className="w-4 h-4 mr-2" /> Reject
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction('approved')} // TRIGGER KONFIRMASI (2-STEP)
                                            className="flex-1 md:flex-none px-6 py-2.5 bg-[#10B981] text-white rounded-xl font-bold text-sm hover:bg-green-600 shadow-sm transition-colors flex items-center justify-center"
                                        >
                                            <Check className="w-4 h-4 mr-2" /> Approve
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={closeModal} className="w-full md:w-auto px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 shadow-sm transition-colors">
                                        Tutup
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ========================================= */}
                        {/* 3. OVERLAY 2-STEP VERIFICATION (z-index 70) */}
                        {/* ========================================= */}
                        {confirmAction && (
                            <div className="absolute inset-0 z-[70] flex items-center justify-center bg-white/80 backdrop-blur-sm p-6 animate-in fade-in zoom-in-95 duration-200 rounded-3xl">
                                <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center text-center">

                                    {/* Ikon Dinamis (Hijau untuk Approve, Merah untuk Reject) */}
                                    {confirmAction === 'approved' ? (
                                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-5">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5">
                                            <AlertTriangle className="w-8 h-8" />
                                        </div>
                                    )}

                                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                                        {confirmAction === 'approved' ? 'Setujui Aktivitas?' : 'Tolak Aktivitas?'}
                                    </h3>

                                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                                        {confirmAction === 'approved'
                                            ? `Anda akan menyetujui aktivitas dari ${selectedSubmission.participant_name}. Sistem akan menambahkan Poin & EXP secara otomatis. Tindakan ini tidak dapat dibatalkan.`
                                            : `Anda akan menolak pengajuan aktivitas ini. Pengguna tidak akan mendapatkan Poin & EXP. Tindakan ini tidak dapat dibatalkan.`
                                        }
                                    </p>

                                    <div className="flex space-x-3 w-full">
                                        <button
                                            onClick={() => setConfirmAction(null)}
                                            disabled={isVerifying}
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                            Kembali
                                        </button>
                                        <button
                                            onClick={executeVerification}
                                            disabled={isVerifying}
                                            className={`flex-1 px-4 py-3 rounded-xl text-white font-bold shadow-sm transition-colors disabled:opacity-50 ${confirmAction === 'approved' ? 'bg-[#10B981] hover:bg-green-600' : 'bg-red-600 hover:bg-red-700'
                                                }`}
                                        >
                                            {isVerifying ? 'Memproses...' : 'Ya, Lanjutkan'}
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}