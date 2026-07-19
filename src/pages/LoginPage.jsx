import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSeger from '../assets/logo-seger.png';
import { BASE_URL } from '../utils/apiConfig';

export default function LoginPage() {
    // STATE UNTUK NAVIGASI VIEW: 'login' | 'forgot' | 'reset'
    const [view, setView] = useState('login');

    // STATE FORM DATA
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    // STATE UI & STATUS
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const navigate = useNavigate();

    // 1. HANDLER LOGIN NORMAL
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const userRole = data.data.user?.role || data.data.role;
                const userName = data.data.user?.fullName || data.data.user?.full_name || 'Administrator';

                if (userRole === 'admin') {
                    localStorage.setItem('jwt_token', data.data.token);
                    localStorage.setItem('admin_name', userName);
                    navigate('/dashboard');
                } else {
                    setErrorMsg('Username atau password salah.');
                }
            } else {
                setErrorMsg(data.message || 'Login gagal, periksa email dan password.');
            }
        } catch (error) {
            setErrorMsg('Terjadi kesalahan koneksi jaringan.');
        } finally {
            setIsLoading(false);
        }
    };

    // 2. HANDLER REQUEST OTP (LUPA PASSWORD)
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMsg(data.data.message || 'Instruksi reset telah dikirim ke email Anda.');
                setView('reset'); // Pindah ke tampilan form Reset
            } else {
                setErrorMsg(data.message || 'Gagal mengirim instruksi reset. Pastikan email terdaftar.');
            }
        } catch (error) {
            setErrorMsg('Terjadi kesalahan koneksi jaringan.');
        } finally {
            setIsLoading(false);
        }
    };

    // 3. HANDLER SUBMIT RESET PASSWORD
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetch(`${BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email, 
                    otp: otp, 
                    new_password: newPassword 
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMsg(data.data.message || 'Password berhasil direset. Silakan masuk.');
                setView('login'); // Kembali ke tampilan login
                setPassword(''); // Kosongkan field password lama
                setOtp('');
                setNewPassword('');
            } else {
                setErrorMsg(data.message || 'Gagal mereset password. Pastikan OTP valid.');
            }
        } catch (error) {
            setErrorMsg('Terjadi kesalahan koneksi jaringan.');
        } finally {
            setIsLoading(false);
        }
    };

    // HELPER KEMBALI KE LOGIN
    const backToLogin = () => {
        setView('login');
        setErrorMsg('');
        setSuccessMsg('');
        setOtp('');
        setNewPassword('');
    };

    return (
        <div className="min-h-screen flex w-full font-sans bg-[#F7F8FC]">

            {/* PANEL KIRI - BRANDING */}
            <div className="hidden md:flex md:w-2/5 lg:w-1/3 bg-[#5A2EFF] flex-col justify-between items-center p-12 text-white">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="mb-6 flex flex-col items-center">
                        <img
                            src={logoSeger}
                            alt="Logo SEGER"
                            className="w-64 h-64 object-contain drop-shadow-xl"
                        />
                        <h1 className="text-5xl font-extrabold tracking-wide mt-6">SEGER</h1>
                        <p className="text-indigo-200 text-sm mt-3 font-medium tracking-wide">Active Today, Stronger Tomorrow</p>
                    </div>
                </div>

                {/* Footer Panel Kiri */}
                <div className="text-center opacity-80">
                    <p className="text-[10px] text-white uppercase tracking-widest leading-relaxed">
                        POWERED BY KOMBALA<br />
                        PLN INDONESIA POWER UBP JAWA TENGAH 2 ADIPALA<br />
                        ALPHA BUILD V1.0
                    </p>
                </div>
            </div>

            {/* PANEL KANAN - FORM AREA */}
            <div className="w-full md:w-3/5 lg:w-2/3 flex items-center justify-center p-6 md:p-12 relative">
                <div className="bg-white w-full max-w-[460px] p-8 sm:p-12 rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">

                    {/* Judul & Subjudul Dinamis */}
                    <div className="text-center mb-10">
                        <h2 className="text-[28px] font-extrabold text-gray-900 mb-2 tracking-tight">
                            {view === 'login' ? 'Selamat Datang' : view === 'forgot' ? 'Lupa Password' : 'Reset Password'}
                        </h2>
                        <p className="text-gray-500 text-sm font-medium px-4">
                            {view === 'login' && 'Masuk untuk memulai'}
                            {view === 'forgot' && 'Masukkan email Anda untuk menerima kode OTP pemulihan'}
                            {view === 'reset' && 'Masukkan kode OTP dari email dan buat password baru'}
                        </p>
                    </div>

                    {/* Notifikasi Error */}
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-start">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Notifikasi Sukses */}
                    {successMsg && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-100 flex items-start">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* ==================== TAMPILAN LOGIN ==================== */}
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] focus:border-transparent transition-all text-sm font-medium text-gray-800"
                                        placeholder="admin@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] focus:border-transparent transition-all text-sm font-medium tracking-wide text-gray-800"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#5A2EFF] transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        )}
                                    </button>
                                </div>
                                <div className="text-right mt-3">
                                    <button 
                                        type="button" 
                                        onClick={() => { setView('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                                        className="text-sm font-bold text-[#5A2EFF] hover:text-indigo-800 hover:underline transition-all"
                                    >
                                        Lupa Password?
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-4 rounded-xl text-white font-bold text-[15px] transition-all shadow-md ${isLoading
                                        ? 'bg-rose-400 shadow-none cursor-not-allowed'
                                        : 'bg-[#E11D48] hover:bg-[#BE123C] hover:shadow-rose-200 hover:-translate-y-0.5 active:translate-y-0'
                                        }`}
                                >
                                    {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ==================== TAMPILAN LUPA PASSWORD (KIRIM OTP) ==================== */}
                    {view === 'forgot' && (
                        <form onSubmit={handleForgotPassword} className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Email Terdaftar</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] focus:border-transparent transition-all text-sm font-medium text-gray-800"
                                        placeholder="admin@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-2 space-y-3">
                                <button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className={`w-full py-4 rounded-xl text-white font-bold text-[15px] transition-all shadow-md ${isLoading || !email
                                        ? 'bg-[#818CF8] shadow-none cursor-not-allowed'
                                        : 'bg-[#5A2EFF] hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0'
                                        }`}
                                >
                                    {isLoading ? 'Mengirim...' : 'Kirim Kode OTP'}
                                </button>
                                <button
                                    type="button"
                                    onClick={backToLogin}
                                    disabled={isLoading}
                                    className="w-full py-3.5 rounded-xl text-gray-600 font-bold text-sm bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200"
                                >
                                    Kembali ke Login
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ==================== TAMPILAN RESET PASSWORD (INPUT OTP & PASS BARU) ==================== */}
                    {view === 'reset' && (
                        <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right-8 duration-300">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm font-bold cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Kode OTP</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                    </div>
                                    <input
                                        type="text"
                                        autoComplete="one-time-code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] focus:border-transparent transition-all text-sm font-bold tracking-widest text-gray-800 text-center"
                                        placeholder="123456"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Password Baru</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] focus:border-transparent transition-all text-sm font-medium tracking-wide text-gray-800"
                                        placeholder="Min. 8 Karakter"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#5A2EFF] transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2 space-y-3">
                                <button
                                    type="submit"
                                    disabled={isLoading || !otp || !newPassword}
                                    className={`w-full py-4 rounded-xl text-white font-bold text-[15px] transition-all shadow-md ${isLoading || !otp || !newPassword
                                        ? 'bg-rose-400 shadow-none cursor-not-allowed'
                                        : 'bg-[#E11D48] hover:bg-[#BE123C] hover:shadow-rose-200 hover:-translate-y-0.5 active:translate-y-0'
                                        }`}
                                >
                                    {isLoading ? 'Memproses...' : 'Simpan Password Baru'}
                                </button>
                                <button
                                    type="button"
                                    onClick={backToLogin}
                                    disabled={isLoading}
                                    className="w-full py-3.5 rounded-xl text-gray-600 font-bold text-sm bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200"
                                >
                                    Batal & Kembali
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}