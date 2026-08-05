import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardCheck, CheckCircle, Gift } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, Button, SortableTh } from '../components/ui';
import { useTableSort } from '../hooks/useTableSort';
import { getBaseUrl } from '../utils/apiConfig';

function RecentPendingTable({ items }) {
    const { sortedItems, sortKey, sortDir, requestSort } = useTableSort(items);

    return (
        <table className="w-full text-left text-sm">
            <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                    <SortableTh label="Nama User" sortKey="participant_name" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="pb-3 px-0 font-semibold w-1/3" />
                    <SortableTh label="Aktivitas" sortKey="activity_type" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="pb-3 px-0 font-semibold" />
                    <SortableTh label="Jarak" sortKey="distance_km" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="right" className="pb-3 px-0 font-semibold" />
                    <SortableTh label="Waktu" sortKey="submitted_at" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="right" className="pb-3 px-0 font-semibold" />
                </tr>
            </thead>
            <tbody>
                {sortedItems.slice(0, 3).map((item) => {
                    const dateObj = new Date(item.submitted_at);
                    const formattedTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                    return (
                        <tr key={item.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
                            <td className="py-3.5 font-bold text-gray-800">{item.participant_name}</td>
                            <td className="py-3.5">
                                <span className="bg-indigo-50 text-[#5A2EFF] font-bold px-2.5 py-1 rounded-md text-xs">
                                    {item.activity_type}
                                </span>
                            </td>
                            <td className="py-3.5 font-bold text-gray-700 text-right">{item.distance_km} km</td>
                            <td className="py-3.5 text-gray-500 text-xs text-right font-medium">{formattedTime} WIB</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export default function DashboardHome() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate(); // <-- INISIALISASI NAVIGATE DI SINI

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('jwt_token');
                const response = await fetch(`${getBaseUrl()}/admin/dashboard?range=7d`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const json = await response.json();

                if (json.status === 'success') {
                    setData(json.data);
                }
            } catch (error) {
                console.error("Gagal mengambil data dashboard", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><p className="text-gray-500 font-medium">Memuat data statistik...</p></div>;
    }

    if (!data) {
        return <div className="text-red-500">Gagal memuat data. Periksa koneksi internet.</div>;
    }

    const formatChartData = (chartData, dataKey) => {
        return chartData.map(item => ({
            name: item.label,
            [dataKey]: item[dataKey]
        }));
    };

    const activityData = formatChartData(data.charts.activity_submissions, 'submissions');
    const pointsData = formatChartData(data.charts.points_distribution, 'points');

    return (
        <div className="space-y-6">
            <PageHeader
                title="Statistik Minggu Ini"
                subtitle="Ringkasan performa komunitas 7 hari terakhir"
            />

            {/* 4 KARTU STATISTIK ATAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="USER BARU" value={data.summary.total_users.value} changePct={data.summary.total_users.change_pct} icon={Users} color="bg-indigo-100 text-[#5A2EFF]" />
                <StatCard title="PENDING SUBMISSIONS" value={data.summary.pending_submissions.value} icon={ClipboardCheck} color="bg-orange-100 text-orange-600" />
                <StatCard title="APPROVED MINGGU INI" value={data.summary.approved_activities.value} changePct={data.summary.approved_activities.change_pct} icon={CheckCircle} color="bg-blue-100 text-blue-600" />
                <StatCard title="REDEMPTIONS MINGGU INI" value={data.summary.redemptions.value} changePct={data.summary.redemptions.change_pct} icon={Gift} color="bg-rose-100 text-rose-600" />
            </div>

            {/* 2 GRAFIK (CHARTS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Bar Chart - Pengajuan Aktivitas */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900">Pengajuan Aktivitas</h3>
                    <p className="text-xs text-gray-500 mb-6">Trend pengajuan dalam 7 hari terakhir</p>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="submissions" fill="#5A2EFF" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Line Chart - Distribusi Point */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900">Distribusi Point</h3>
                    <p className="text-xs text-gray-500 mb-6">Trend distribusi point dalam 7 hari terakhir</p>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={pointsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="points" stroke="#5A2EFF" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* BAGIAN BAWAH (PENGAJUAN TERBARU & BANNER REWARD) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* List Pengajuan Terbaru - Diubah Menjadi Mini Table */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900">Pengajuan Terbaru</h3>
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">Pending</span>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        {data.recent_pending_submissions && data.recent_pending_submissions.length > 0 ? (
                            <RecentPendingTable items={data.recent_pending_submissions} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                <ClipboardCheck className="w-10 h-10 mb-2 opacity-30" />
                                <p className="text-sm font-medium">Belum ada pengajuan pending</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Banner Reward */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-3 leading-tight">
                        Berikan Reward Terbaik<br />Untuk Komunitas Anda
                    </h2>
                    <p className="text-sm text-gray-500 mb-8 max-w-md leading-relaxed">
                        Pantau perkembangan setiap anggota dan berikan apresiasi yang sesuai untuk meningkatkan motivasi berolahraga.
                    </p>
                    <div className="flex space-x-4">
                        <Button onClick={() => navigate('/hadiah')}>
                            Atur Reward
                        </Button>
                        <Button variant="secondary" onClick={() => navigate('/users')}>
                            Lihat Member
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ title, value, changePct, icon: Icon, color }) {
    const hasChange = typeof changePct === 'number';
    const isPositive = hasChange && changePct >= 0;

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
                <p className="text-[10px] font-bold text-gray-500 tracking-wider mb-1 uppercase">{title}</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{value}</h3>
                {hasChange && (
                    <p className={`mt-1 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{changePct}% vs minggu lalu
                    </p>
                )}
            </div>
            <div className={`p-2.5 rounded-full ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
    );
}