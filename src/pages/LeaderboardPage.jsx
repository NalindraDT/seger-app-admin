import { useState, useEffect } from 'react';
import {
    Trophy, Crown, ChevronLeft, ChevronRight, Award,
    CalendarDays, Filter, Building2, Users, FileDown, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PageHeader, Button, Select, Modal, FormField, Toast } from '../components/ui';
import { getBaseUrl } from '../utils/apiConfig';

const getEntryXp = (entry, isDepartmentView) => {
    if (isDepartmentView) {
        return Number(entry.total_xp ?? entry.xp ?? 0);
    }
    return Number(entry.xp ?? 0);
};

function PodiumItem({ entry, rank, isDepartmentView, getItemName, getItemAvatar }) {
    if (!entry) return <div className="w-24 sm:w-32 h-24 sm:h-32 opacity-0"></div>;

    const isFirst = rank === 1;
    const isSecond = rank === 2;

    const ringColor = isFirst ? 'ring-yellow-400' : isSecond ? 'ring-gray-300' : 'ring-orange-400';
    const bgColor = isFirst ? 'bg-yellow-50' : isSecond ? 'bg-gray-50' : 'bg-orange-50';
    const textColor = isFirst ? 'text-yellow-600' : isSecond ? 'text-gray-600' : 'text-orange-600';
    const heightClass = isFirst ? 'h-48' : isSecond ? 'h-40' : 'h-32';
    const displayName = getItemName(entry);

    return (
        <div className={`flex flex-col items-center justify-end ${isFirst ? 'order-2 z-10 -mt-8' : isSecond ? 'order-1' : 'order-3'}`}>
            {isFirst && <Crown className="w-10 h-10 text-yellow-500 mb-2 drop-shadow-md animate-bounce" />}
            <div className="relative mb-4">
                {isDepartmentView ? (
                    <div className={`rounded-full object-cover border-4 border-white shadow-lg ring-4 ${ringColor} ${isFirst ? 'w-24 h-24' : 'w-20 h-20'} bg-indigo-50 flex items-center justify-center`}>
                        <Building2 className={`${isFirst ? 'w-10 h-10' : 'w-8 h-8'} text-[#5A2EFF]`} />
                    </div>
                ) : (
                    <img
                        src={getItemAvatar(entry)}
                        alt={displayName}
                        className={`rounded-full object-cover border-4 border-white shadow-lg ring-4 ${ringColor} ${isFirst ? 'w-24 h-24' : 'w-20 h-20'}`}
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${displayName}&background=random&size=128`; }}
                    />
                )}
                <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm shadow-md ${isFirst ? 'bg-yellow-500' : isSecond ? 'bg-gray-400' : 'bg-orange-500'}`}>
                    {rank}
                </div>
            </div>
            <div className={`w-24 sm:w-32 ${bgColor} border border-white rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col items-center justify-start pt-4 ${heightClass}`}>
                <p className="font-extrabold text-gray-900 truncate w-20 sm:w-28 text-center text-xs sm:text-sm">{displayName}</p>
                {isDepartmentView && (
                    <p className="text-[10px] text-gray-500 mt-1">
                        {entry.active_member_count ?? 0} anggota aktif · {(entry.member_count ?? 0)} total
                    </p>
                )}
                <p className={`text-xs font-bold mt-1 ${textColor}`}>
                    {isDepartmentView
                        ? `${entry.active_member_count ?? 0} aktif`
                        : `${getEntryXp(entry, isDepartmentView).toLocaleString()} EXP`}
                </p>
                {isDepartmentView && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{getEntryXp(entry, isDepartmentView).toLocaleString()} EXP total</p>
                )}
            </div>
        </div>
    );
}

export default function LeaderboardPage() {
    // STATE GLOBAL
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [currentDepartment, setCurrentDepartment] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [departmentMembers, setDepartmentMembers] = useState([]);
    const [isMembersLoading, setIsMembersLoading] = useState(false);

    // STATE TABS & FILTERS
    const [activeTab, setActiveTab] = useState('individual'); // 'individual' | 'department' | 'event'
    const [period, setPeriod] = useState('monthly'); // 'daily' | 'weekly' | 'monthly' | 'annual'
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('success');
        }, 4000);
    };

    const buildLeaderboardUrl = (page, limit) => {
        if (activeTab === 'individual') {
            return period === 'annual'
                ? `${getBaseUrl()}/leaderboard/annual?page=${page}&limit=${limit}`
                : `${getBaseUrl()}/leaderboard/${period}?page=${page}&limit=${limit}`;
        }
        if (activeTab === 'department') {
            return `${getBaseUrl()}/leaderboard/departments/${period}?page=${page}&limit=${limit}`;
        }
        if (activeTab === 'event' && selectedEventId) {
            return `${getBaseUrl()}/leaderboard/events/${selectedEventId}?page=${page}&limit=${limit}`;
        }
        return null;
    };

    const fetchAllLeaderboardItems = async () => {
        const token = localStorage.getItem('jwt_token');
        const limit = 100;
        let page = 1;
        let allItems = [];
        let totalPages = 1;

        do {
            const url = buildLeaderboardUrl(page, limit);
            if (!url) return [];

            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await response.json();

            if (!json.success) {
                throw new Error(json.error?.message || 'Gagal mengambil data leaderboard');
            }

            allItems = allItems.concat(json.data.items || []);
            totalPages = json.data.pagination?.totalPages ?? 1;
            page += 1;
        } while (page <= totalPages);

        return allItems;
    };

    const getExportMeta = () => {
        const tabLabel = activeTab === 'individual' ? 'Individual' : activeTab === 'department' ? 'Departemen' : 'Event';
        const periodLabel = activeTab === 'event'
            ? (events.find(e => e.id === selectedEventId)?.name || 'Event')
            : period;
        return { tabLabel, periodLabel };
    };

    const exportExcel = async () => {
        setIsExporting(true);
        try {
            const items = await fetchAllLeaderboardItems();
            if (!items.length) {
                showToast('Tidak ada data leaderboard untuk diekspor.', 'error');
                return;
            }
            const { tabLabel, periodLabel } = getExportMeta();
            const isDept = activeTab === 'department';
            const header = isDept
                ? ['Rank', 'Departemen', 'EXP Total', 'Anggota Aktif', 'Total Anggota']
                : ['Rank', 'Nama', 'EXP', 'Departemen'];
            const rows = items.map((item) => isDept
                ? [item.rank, item.department_name, getEntryXp(item, true), item.active_member_count ?? 0, item.member_count ?? 0]
                : [item.rank, item.full_name, getEntryXp(item, false), item.department_name || '-']);
            const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard');
            XLSX.writeFile(wb, `leaderboard_${tabLabel}_${periodLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showToast('Leaderboard berhasil diekspor ke Excel.');
        } catch (error) {
            console.error('Export Excel gagal', error);
            showToast('Gagal export Excel', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const exportPdf = async () => {
        setIsExporting(true);
        try {
            const items = await fetchAllLeaderboardItems();
            if (!items.length) {
                showToast('Tidak ada data leaderboard untuk diekspor.', 'error');
                return;
            }
            const { tabLabel, periodLabel } = getExportMeta();
            const isDept = activeTab === 'department';
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text(`Leaderboard ${tabLabel}`, 14, 18);
            doc.setFontSize(10);
            doc.text(`Periode: ${periodLabel}`, 14, 26);
            doc.text(`Diekspor: ${new Date().toLocaleString('id-ID')}`, 14, 32);
            autoTable(doc, {
                startY: 38,
                head: [isDept
                    ? ['Rank', 'Departemen', 'EXP', 'Aktif', 'Total']
                    : ['Rank', 'Nama', 'EXP', 'Departemen']],
                body: items.map((item) => isDept
                    ? [item.rank, item.department_name, getEntryXp(item, true), item.active_member_count ?? 0, item.member_count ?? 0]
                    : [item.rank, item.full_name, getEntryXp(item, false), item.department_name || '-']),
            });
            doc.save(`leaderboard_${tabLabel}_${periodLabel}_${new Date().toISOString().slice(0, 10)}.pdf`);
            showToast('Leaderboard berhasil diekspor ke PDF.');
        } catch (error) {
            console.error('Export PDF gagal', error);
            showToast('Gagal export PDF', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    // 1. FETCH DAFTAR EVENT UNTUK DROPDOWN
    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/events?page=1&limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success && json.data.items.length > 0) {
                setEvents(json.data.items);
                setSelectedEventId(json.data.items[0].id);
            }
        } catch (error) {
            console.error("Gagal mengambil daftar event", error);
        }
    };

    const fetchDepartmentMembers = async (department) => {
        if (!department?.department_id) return;
        setSelectedDepartment(department);
        setIsMembersLoading(true);
        setDepartmentMembers([]);

        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(
                `${getBaseUrl()}/leaderboard/departments/${department.department_id}/${period}?page=1&limit=20`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const json = await response.json();
            if (json.success) {
                setDepartmentMembers(json.data.items ?? []);
            }
        } catch (error) {
            console.error('Gagal mengambil anggota departemen', error);
        } finally {
            setIsMembersLoading(false);
        }
    };

    const closeDepartmentMembers = () => {
        setSelectedDepartment(null);
        setDepartmentMembers([]);
    };

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            let url = '';

            if (activeTab === 'individual') {
                url = period === 'annual'
                    ? `${getBaseUrl()}/leaderboard/annual?page=${currentPage}&limit=10`
                    : `${getBaseUrl()}/leaderboard/${period}?page=${currentPage}&limit=10`;
            } else if (activeTab === 'department') {
                url = `${getBaseUrl()}/leaderboard/departments/${period}?page=${currentPage}&limit=10`;
            } else if (activeTab === 'event') {
                if (!selectedEventId) {
                    setLeaderboard([]);
                    setIsLoading(false);
                    return;
                }
                // Menembak endpoint event spesifik
                url = `${getBaseUrl()}/leaderboard/events/${selectedEventId}?page=${currentPage}&limit=10`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                setLeaderboard(json.data.items || []);
                setCurrentDepartment(json.data.current_department ?? null);
                if (json.data.pagination) {
                    setTotalPages(json.data.pagination.totalPages);
                    setTotalItems(json.data.pagination.totalItems);
                }
            } else {
                setLeaderboard([]);
                setCurrentDepartment(null);
            }
        } catch (error) {
            console.error("Gagal mengambil data leaderboard", error);
            setLeaderboard([]);
            setCurrentDepartment(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Inisialisasi awal ambil daftar event
    useEffect(() => {
        fetchEvents();
    }, []);

    // Trigger fetch saat tab, filter, atau page berubah
    useEffect(() => {
        fetchLeaderboard();
    }, [currentPage, activeTab, period, selectedEventId]);

    // Memisahkan Top 3 untuk UI Podium
    const top3 = leaderboard.slice(0, 3);
    const others = leaderboard; 

    const isDepartmentView = activeTab === 'department';

    const getItemKey = (item) => isDepartmentView ? (item.department_id || item.rank) : item.user_id;

    const getItemName = (item) => isDepartmentView ? (item.department_name || 'Departemen') : item.full_name;

    const getItemAvatar = (item) => {
        if (isDepartmentView) {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.department_name || 'Dept')}&background=5A2EFF&color=fff&size=128`;
        }
        return item.profile_photo_url || `https://ui-avatars.com/api/?name=${item.full_name}&background=random&size=128`;
    };

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

            <PageHeader
                title="Leaderboard"
                subtitle="Pantau peringkat pengguna berdasarkan akumulasi EXP"
                actions={
                    <>
                        <Button variant="secondary" size="sm" icon={FileDown} onClick={exportExcel} loading={isExporting}>
                            Excel
                        </Button>
                        <Button variant="secondary" size="sm" icon={FileText} onClick={exportPdf} loading={isExporting}>
                            PDF
                        </Button>
                    </>
                }
            />

            {/* TABS MENU */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex w-max min-w-full space-x-6 sm:space-x-8">
                    <button
                        onClick={() => { setActiveTab('individual'); setCurrentPage(1); }}
                        className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'individual' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <Users className="w-4 h-4 mr-2" /> Individual
                    </button>
                    <button
                        onClick={() => { setActiveTab('department'); setCurrentPage(1); }}
                        className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'department' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <Building2 className="w-4 h-4 mr-2" /> Departemen
                    </button>
                    <button
                        onClick={() => { setActiveTab('event'); setCurrentPage(1); }}
                        className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'event' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <CalendarDays className="w-4 h-4 mr-2" /> Peringkat Event
                    </button>
                </nav>
            </div>

            {/* FILTER TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center text-sm font-bold text-gray-500 px-2">
                    <Filter className="w-4 h-4 mr-2" /> Filter Data:
                </div>

                {(activeTab === 'individual' || activeTab === 'department') ? (
                    <div className="flex bg-[#F8F9FC] p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                        {[
                            { id: 'daily', label: 'Harian' },
                            { id: 'weekly', label: 'Mingguan' },
                            { id: 'monthly', label: 'Bulanan' },
                            { id: 'annual', label: 'Tahunan' }
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => { setPeriod(p.id); setCurrentPage(1); }}
                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${period === p.id ? 'bg-white text-[#5A2EFF] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <FormField label="Pilih Event" className="w-full sm:w-80">
                        <Select
                            value={selectedEventId}
                            onChange={(e) => { setSelectedEventId(e.target.value); setCurrentPage(1); }}
                        >
                            {events.length === 0 ? (
                                <option value="">-- Tidak ada event aktif --</option>
                            ) : (
                                events.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                                ))
                            )}
                        </Select>
                    </FormField>
                )}
            </div>

            {/* KONTEN UTAMA LEADERBOARD */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#5A2EFF] border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-bold text-gray-500">Memuat klasemen...</p>
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-sm">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Belum ada data</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Belum ada data {isDepartmentView ? 'departemen' : 'pengguna'} yang mendapatkan EXP di {activeTab === 'event' ? 'event ini' : 'periode ini'}.
                    </p>
                </div>
            ) : (
                <>
                    {/* ========================================= */}
                    {/* TOP 3 PODIUM SECTION                      */}
                    {/* ========================================= */}
                    {currentPage === 1 && top3.length > 0 && (
                        <div className="bg-white rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-end min-h-[280px] sm:min-h-[340px] relative overflow-hidden">
                            {/* Efek Cahaya Latar Belakang */}
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-yellow-50 to-transparent rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                            <div className="flex items-end justify-center gap-1 sm:gap-6 relative z-10 mt-8 sm:mt-12 scale-90 sm:scale-100 origin-bottom">
                                {top3[1] && <PodiumItem entry={top3[1]} rank={2} isDepartmentView={isDepartmentView} getItemName={getItemName} getItemAvatar={getItemAvatar} />}
                                {top3[0] && <PodiumItem entry={top3[0]} rank={1} isDepartmentView={isDepartmentView} getItemName={getItemName} getItemAvatar={getItemAvatar} />}
                                {top3[2] && <PodiumItem entry={top3[2]} rank={3} isDepartmentView={isDepartmentView} getItemName={getItemName} getItemAvatar={getItemAvatar} />}
                            </div>
                        </div>
                    )}

                    {/* ========================================= */}
                    {/* TABLE LEADERBOARD                         */}
                    {/* ========================================= */}
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mt-6">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FC]">
                            <h3 className="font-bold text-gray-900 flex items-center">
                                <Award className="w-4 h-4 text-[#5A2EFF] mr-2" />
                                {activeTab === 'event' ? 'Daftar Peringkat Event' : isDepartmentView ? 'Departemen Paling Aktif' : 'Daftar Peringkat Individual'}
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-center w-20">Rank</th>
                                        <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">{isDepartmentView ? 'Departemen' : 'User'}</th>
                                        {isDepartmentView ? (
                                            <>
                                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-center">Anggota</th>
                                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-center">Aktif</th>
                                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-right">Rata-rata EXP</th>
                                            </>
                                        ) : null}
                                        <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-right pr-10">Total EXP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {others.map((item) => (
                                        <tr
                                            key={getItemKey(item)}
                                            className={`transition-colors group ${isDepartmentView ? 'hover:bg-indigo-50/50 cursor-pointer' : 'hover:bg-indigo-50/30'}`}
                                            onClick={isDepartmentView ? () => fetchDepartmentMembers(item) : undefined}
                                        >
                                            <td className="px-6 py-4 text-center">
                                                {item.rank === 1 ? (
                                                    <span className="inline-flex w-8 h-8 items-center justify-center bg-yellow-100 text-yellow-600 rounded-full font-black text-sm">1</span>
                                                ) : item.rank === 2 ? (
                                                    <span className="inline-flex w-8 h-8 items-center justify-center bg-gray-100 text-gray-600 rounded-full font-black text-sm">2</span>
                                                ) : item.rank === 3 ? (
                                                    <span className="inline-flex w-8 h-8 items-center justify-center bg-orange-100 text-orange-600 rounded-full font-black text-sm">3</span>
                                                ) : (
                                                    <span className="font-bold text-gray-500">{item.rank}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-4">
                                                    {isDepartmentView ? (
                                                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                                                            <Building2 className="w-5 h-5 text-[#5A2EFF]" />
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={getItemAvatar(item)}
                                                            alt="Avatar"
                                                            className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${getItemName(item)}&background=random`; }}
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-extrabold text-gray-900 group-hover:text-[#5A2EFF] transition-colors">{getItemName(item)}</p>
                                                        {!isDepartmentView && item.user_id && (
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">ID: {item.user_id.substring(0, 8)}...</p>
                                                        )}
                                                        {isDepartmentView && (
                                                            <p className="text-[10px] text-indigo-500 font-semibold">Klik untuk lihat anggota XP tertinggi</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {isDepartmentView ? (
                                                <>
                                                    <td className="px-6 py-4 text-center font-bold text-gray-700">{item.member_count ?? 0}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{item.active_member_count ?? 0}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-gray-700">{(item.avg_xp_per_member ?? 0).toLocaleString()}</td>
                                                </>
                                            ) : null}
                                            <td className="px-6 py-4 text-right pr-10">
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 text-gray-800 font-black text-sm border border-gray-100">
                                                    {getEntryXp(item, isDepartmentView).toLocaleString()} <span className="text-gray-400 text-xs ml-1">EXP</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white">
                            <p className="text-sm text-gray-500 font-medium">
                                Showing {leaderboard.length > 0 ? ((currentPage - 1) * 10) + 1 : 0}-{Math.min(currentPage * 10, totalItems)} of {totalItems} entries
                            </p>
                            <div className="flex space-x-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                                <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#5A2EFF] text-white font-bold text-sm">{currentPage}</button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <Modal
                open={!!selectedDepartment}
                onClose={closeDepartmentMembers}
                title={selectedDepartment?.department_name ?? 'Departemen'}
                subtitle={`Anggota dengan XP tertinggi · periode ${period}`}
                icon={Users}
                size="lg"
            >
                {isMembersLoading ? (
                    <div className="py-10 text-center text-gray-500">Memuat anggota...</div>
                ) : departmentMembers.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">Belum ada anggota aktif di departemen ini.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-100 bg-white">
                                <tr>
                                    <th className="w-16 px-2 py-3 text-center text-[11px] font-bold uppercase text-gray-500">Rank</th>
                                    <th className="px-2 py-3 text-[11px] font-bold uppercase text-gray-500">Nama</th>
                                    <th className="pr-2 py-3 text-right text-[11px] font-bold uppercase text-gray-500">XP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {departmentMembers.map((member) => (
                                    <tr key={member.user_id} className="hover:bg-indigo-50/30">
                                        <td className="px-2 py-3 text-center font-bold text-gray-600">{member.rank}</td>
                                        <td className="px-2 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={member.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || 'User')}&background=random`}
                                                    alt={member.full_name}
                                                    className="h-9 w-9 rounded-full border border-gray-200 object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || 'User')}&background=random`; }}
                                                />
                                                <span className="font-semibold text-gray-900">{member.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 text-right font-bold text-gray-800">{(member.xp ?? 0).toLocaleString()} EXP</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal>
        </div>
    );
}