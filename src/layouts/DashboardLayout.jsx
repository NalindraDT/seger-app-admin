import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardList, Users, Activity,
    BookOpen, Gift, BarChart2, Settings, LogOut, X,
    ClockAlert, Medal, CalendarDays, Flame, ChevronDown, Trophy, Building2, Landmark
} from 'lucide-react';
import { getBaseUrl } from '../utils/apiConfig';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    const [adminName, setAdminName] = useState('Administrator');
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [isSessionExpired, setIsSessionExpired] = useState(false);

    const [openMenus, setOpenMenus] = useState({
        'Gamifikasi': false,
        'Pengaturan': false
    });

    // STATE BARU: Untuk menyimpan jumlah pending submissions
    const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);

    const navigation = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Submissions', path: '/submissions', icon: ClipboardList, badge: pendingSubmissionsCount }, // Tambahkan properti badge
        { name: 'Users', path: '/users', icon: Users },
        { name: 'Perusahaan', path: '/companies', icon: Landmark },
        { name: 'Departemen', path: '/departments', icon: Building2 },
        {
            name: 'Gamifikasi',
            icon: Trophy,
            subMenus: [
                { name: 'Leaderboard', path: '/leaderboard', icon: BarChart2 },
                { name: 'Badges', path: '/badges', icon: Medal },
                { name: 'Streak', path: '/streak', icon: Flame },
                { name: 'Events', path: '/events', icon: CalendarDays },
                { name: 'Hadiah', path: '/hadiah', icon: Gift }, // Kamu bisa menambahkan badge di sini juga nanti jika perlu
            ]
        },
        {
            name: 'Pengaturan',
            icon: Settings,
            subMenus: [
                { name: 'Aktifitas', path: '/aktifitas', icon: Activity },
                { name: 'Aturan EXP & Poin', path: '/aturan', icon: BookOpen },
                { name: 'Admin Settings', path: '/settings', icon: Settings },
            ]
        }
    ];

    const checkTokenValidity = () => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            setIsSessionExpired(true);
            return;
        }
        try {
            const payloadBase64 = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));
            const expiryTime = decodedPayload.exp * 1000;
            const currentTime = Date.now();

            if (currentTime >= expiryTime) {
                setIsSessionExpired(true);
            }
        } catch (error) {
            setIsSessionExpired(true);
        }
    };

    const fetchAdminProfile = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            if (!token) return;

            const response = await fetch(`${getBaseUrl()}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success && json.data) {
                if (json.data.fullName) setAdminName(json.data.fullName);
                if (json.data.profilePhotoUrl) setProfilePhoto(json.data.profilePhotoUrl);
            }
        } catch (error) {
            console.error("Gagal memuat profil admin untuk header", error);
        }
    };

    // FUNGSI BARU: Ambil data summary untuk mendapatkan total pending
    const fetchDashboardSummary = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            if (!token) return;

            const response = await fetch(`${getBaseUrl()}/admin/dashboard?range=7d`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.status === 'success') {
                // Set value dari API ke state
                setPendingSubmissionsCount(json.data.summary.pending_submissions.value || 0);
            }
        } catch (error) {
            console.error("Gagal mengambil summary dashboard untuk sidebar");
        }
    };

    useEffect(() => {
        const storedName = localStorage.getItem('admin_name');
        if (storedName) setAdminName(storedName);
        
        checkTokenValidity();
        fetchAdminProfile();
        fetchDashboardSummary(); // Panggil fungsi saat layout dimuat

        const intervalId = setInterval(checkTokenValidity, 60000);
        window.addEventListener('focus', checkTokenValidity);
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', checkTokenValidity);
        };
    }, []);

    useEffect(() => {
        navigation.forEach(menu => {
            if (menu.subMenus) {
                const isChildActive = menu.subMenus.some(sub => location.pathname.startsWith(sub.path));
                if (isChildActive) {
                    setOpenMenus(prev => ({ ...prev, [menu.name]: true }));
                }
            }
        });
    }, [location.pathname]);

    const toggleMenu = (menuName) => {
        setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
    };

    const confirmLogout = async () => {
        setIsLoggingOut(true);
        try {
            const token = localStorage.getItem('jwt_token');
            await fetch(`${getBaseUrl()}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error("Gagal menghubungi server untuk logout");
        } finally {
            localStorage.removeItem('jwt_token');
            setIsLogoutModalOpen(false);
            navigate('/login');
        }
    };

    const handleForceLogout = () => {
        localStorage.removeItem('jwt_token');
        setIsSessionExpired(false);
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-[#F8F9FD] font-sans">
            {/* SIDEBAR KIRI */}
            <div className="w-64 bg-[#F8F9FD] border-r border-gray-200 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                <div>
                    <div className="p-6">
                        <h1 className="text-xl font-extrabold text-[#5A2EFF]">SEGER Admin</h1>
                        <p className="text-[11px] text-gray-500 font-medium mt-1">Admin Control Panel</p>
                    </div>
                    <nav className="mt-2 px-4 space-y-2 pb-6">
                        {navigation.map((menu) => (
                            <div key={menu.name}>
                                {menu.subMenus ? (
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => toggleMenu(menu.name)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                                menu.subMenus.some(sub => location.pathname.startsWith(sub.path))
                                                    ? 'bg-indigo-50/50 text-[#5A2EFF]' 
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        >
                                            <div className="flex items-center">
                                                <menu.icon className="w-5 h-5 mr-3" />
                                                {menu.name}
                                            </div>
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openMenus[menu.name] ? 'rotate-180 text-[#5A2EFF]' : 'text-gray-400'}`} />
                                        </button>
                                        
                                        <div className={`space-y-1 pl-4 overflow-hidden transition-all duration-300 ease-in-out ${openMenus[menu.name] ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                            {menu.subMenus.map((sub) => (
                                                <NavLink
                                                    key={sub.name} to={sub.path}
                                                    className={({ isActive }) =>
                                                        `flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                            isActive ? 'bg-white text-[#5A2EFF] shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                                        }`
                                                    }
                                                >
                                                    <sub.icon className="w-4 h-4 mr-3 opacity-60" />
                                                    <span className="flex-1">{sub.name}</span>
                                                    
                                                    {/* Tambahkan ini jika submenu (seperti Hadiah) butuh badge */}
                                                    {sub.badge && sub.badge > 0 && (
                                                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                                                            {sub.badge}
                                                        </span>
                                                    )}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <NavLink
                                        to={menu.path}
                                        className={({ isActive }) =>
                                            `flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                                isActive ? 'bg-white text-[#5A2EFF] shadow-sm border border-gray-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`
                                        }
                                    >
                                        <menu.icon className="w-5 h-5 mr-3" />
                                        {/* Modifikasi bagian teks menu agar memenuhi sisa ruang (flex-1) */}
                                        <span className="flex-1">{menu.name}</span>
                                        
                                        {/* TAMPILKAN BADGE JIKA ADA */}
                                        {menu.badge > 0 && (
                                            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 transition-all">
                                                {menu.badge > 99 ? '99+' : menu.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
                
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="flex items-center w-full px-4 py-3 text-sm font-bold text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" /> Logout
                    </button>
                </div>
            </div>

            {/* AREA KANAN */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-tl-3xl shadow-[inset_0_4px_6px_rgba(0,0,0,0.02)]">
                <header className="h-[72px] flex items-center justify-end px-8 border-b border-gray-100">
                    <div className="flex items-center space-x-6">
                        <div className="border-l border-gray-200 pl-6">
                            <Link 
                                to="/profile" 
                                className="flex items-center space-x-3 p-1.5 pr-3 -mr-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 capitalize group-hover:text-[#5A2EFF] transition-colors">
                                        {adminName}
                                    </p>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Administrator
                                    </p>
                                </div>
                                <div className="relative">
                                    <img
                                        src={profilePhoto || `https://ui-avatars.com/api/?name=${adminName}&background=5A2EFF&color=fff`}
                                        alt="Avatar"
                                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100 group-hover:shadow-md transition-all"
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${adminName}&background=5A2EFF&color=fff`; }}
                                    />
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>

            {/* MODAL LOGOUT */}
            {isLogoutModalOpen && !isSessionExpired && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Konfirmasi Keluar</h3>
                                <button onClick={() => setIsLogoutModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>
                            <p className="text-gray-600 text-sm mb-6">Apakah Anda yakin ingin keluar dari sesi admin? Anda harus login kembali untuk masuk.</p>
                            <div className="flex space-x-3">
                                <button onClick={() => setIsLogoutModalOpen(false)} disabled={isLoggingOut} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Batal</button>
                                <button onClick={confirmLogout} disabled={isLoggingOut} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors">
                                    {isLoggingOut ? 'Keluar...' : 'Ya, Keluar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SESI HABIS */}
            {isSessionExpired && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] p-8 text-center relative overflow-hidden transform animate-in zoom-in-95">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-orange-50 to-transparent"></div>
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
                                <ClockAlert className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Sesi Berakhir</h3>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed px-4">
                                Sesi login Anda telah habis karena batas waktu token telah berakhir. Demi keamanan sistem, silakan login kembali.
                            </p>
                            <button
                                onClick={handleForceLogout}
                                className="w-full px-6 py-3.5 rounded-xl bg-[#5A2EFF] text-white font-bold text-sm hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center justify-center"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Kembali ke Halaman Login
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}