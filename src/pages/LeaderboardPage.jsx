import { useState, useEffect } from 'react';
import {
    Trophy, Medal, Crown, Search, ChevronLeft, ChevronRight, Award,
    CalendarDays, Filter, ChevronDown
} from 'lucide-react';
import { getBaseUrl } from '../utils/apiConfig';

export default function LeaderboardPage() {
    // STATE GLOBAL
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // STATE TABS & FILTERS
    const [activeTab, setActiveTab] = useState('regular'); // 'regular' | 'event'
    const [period, setPeriod] = useState('monthly'); // 'daily' | 'weekly' | 'monthly' | 'annual'
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');

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

    // 2. FETCH DATA LEADERBOARD UTAMA
    const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            let url = '';

            if (activeTab === 'regular') {
                url = `${getBaseUrl()}/leaderboard/${period}?page=${currentPage}&limit=10`;
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
                if (json.data.pagination) {
                    setTotalPages(json.data.pagination.totalPages);
                    setTotalItems(json.data.pagination.totalItems);
                }
            } else {
                setLeaderboard([]);
            }
        } catch (error) {
            console.error("Gagal mengambil data leaderboard", error);
            setLeaderboard([]);
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

    // Komponen Helper untuk Podium
    const PodiumItem = ({ user, rank }) => {
        if (!user) return <div className="w-32 h-32 opacity-0"></div>; 

        const isFirst = rank === 1;
        const isSecond = rank === 2;
        const isThird = rank === 3;

        const ringColor = isFirst ? 'ring-yellow-400' : isSecond ? 'ring-gray-300' : 'ring-orange-400';
        const bgColor = isFirst ? 'bg-yellow-50' : isSecond ? 'bg-gray-50' : 'bg-orange-50';
        const textColor = isFirst ? 'text-yellow-600' : isSecond ? 'text-gray-600' : 'text-orange-600';
        const heightClass = isFirst ? 'h-48' : isSecond ? 'h-40' : 'h-32';

        return (
            <div className={`flex flex-col items-center justify-end ${isFirst ? 'order-2 z-10 -mt-8' : isSecond ? 'order-1' : 'order-3'}`}>
                {isFirst && <Crown className="w-10 h-10 text-yellow-500 mb-2 drop-shadow-md animate-bounce" />}
                <div className="relative mb-4">
                    <img
                        src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=random&size=128`}
                        alt={user.full_name}
                        className={`rounded-full object-cover border-4 border-white shadow-lg ring-4 ${ringColor} ${isFirst ? 'w-24 h-24' : 'w-20 h-20'}`}
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user.full_name}&background=random&size=128`; }}
                    />
                    <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm shadow-md ${isFirst ? 'bg-yellow-500' : isSecond ? 'bg-gray-400' : 'bg-orange-500'}`}>
                        {rank}
                    </div>
                </div>
                <div className={`w-32 ${bgColor} border border-white rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col items-center justify-start pt-4 ${heightClass}`}>
                    <p className="font-extrabold text-gray-900 truncate w-28 text-center">{user.full_name}</p>
                    <p className={`text-xs font-bold mt-1 ${textColor}`}>{user.xp.toLocaleString()} EXP</p>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 relative">

            {/* HEADER TITLE */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Leaderboard</h1>
                <p className="text-sm text-gray-500 mt-1">Pantau peringkat pengguna berdasarkan akumulasi EXP</p>
            </div>

            {/* TABS MENU */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => { setActiveTab('regular'); setCurrentPage(1); }}
                        className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors flex items-center ${activeTab === 'regular' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <Trophy className="w-4 h-4 mr-2" /> Peringkat Umum
                    </button>
                    <button
                        onClick={() => { setActiveTab('event'); setCurrentPage(1); }}
                        className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors flex items-center ${activeTab === 'event' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
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

                {activeTab === 'regular' ? (
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
                    <div className="relative w-full sm:w-80">
                        <select
                            value={selectedEventId}
                            onChange={(e) => { setSelectedEventId(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-4 pr-10 py-2.5 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-bold text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5A2EFF]"
                        >
                            {events.length === 0 ? (
                                <option value="">-- Tidak ada event aktif --</option>
                            ) : (
                                events.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                                ))
                            )}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </div>
                    </div>
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
                        Belum ada pengguna yang mendapatkan EXP di {activeTab === 'event' ? 'event ini' : 'periode ini'}.
                    </p>
                </div>
            ) : (
                <>
                    {/* ========================================= */}
                    {/* TOP 3 PODIUM SECTION                      */}
                    {/* ========================================= */}
                    {currentPage === 1 && top3.length > 0 && (
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-end min-h-[340px] relative overflow-hidden">
                            {/* Efek Cahaya Latar Belakang */}
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-yellow-50 to-transparent rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                            <div className="flex items-end justify-center gap-2 sm:gap-6 relative z-10 mt-12">
                                {top3[1] && <PodiumItem user={top3[1]} rank={2} />}
                                {top3[0] && <PodiumItem user={top3[0]} rank={1} />}
                                {top3[2] && <PodiumItem user={top3[2]} rank={3} />}
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
                                {activeTab === 'event' ? 'Daftar Peringkat Event' : 'Daftar Peringkat Keseluruhan'}
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-center w-20">Rank</th>
                                        <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-right pr-10">Total EXP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {others.map((item) => (
                                        <tr key={item.user_id} className="hover:bg-indigo-50/30 transition-colors group">
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
                                                    <img
                                                        src={item.profile_photo_url || `https://ui-avatars.com/api/?name=${item.full_name}&background=random`}
                                                        alt="Avatar"
                                                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${item.full_name}&background=random`; }}
                                                    />
                                                    <div>
                                                        <p className="font-extrabold text-gray-900 group-hover:text-[#5A2EFF] transition-colors">{item.full_name}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">ID: {item.user_id.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-10">
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 text-gray-800 font-black text-sm border border-gray-100">
                                                    {item.xp.toLocaleString()} <span className="text-gray-400 text-xs ml-1">EXP</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
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
        </div>
    );
}