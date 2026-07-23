import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { FormField, Input, Button } from '../components/ui';
import logoSeger from '../assets/logo-seger.png';
import { getBaseUrl } from '../utils/apiConfig';

export default function LoginPage() {
    const [view, setView] = useState('login');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetch(`${getBaseUrl()}/auth/login`, {
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

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetch(`${getBaseUrl()}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMsg(data.data.message || 'Instruksi reset telah dikirim ke email Anda.');
                setView('reset');
            } else {
                setErrorMsg(data.message || 'Gagal mengirim instruksi reset. Pastikan email terdaftar.');
            }
        } catch (error) {
            setErrorMsg('Terjadi kesalahan koneksi jaringan.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetch(`${getBaseUrl()}/auth/reset-password`, {
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
                setView('login');
                setPassword('');
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

    const backToLogin = () => {
        setView('login');
        setErrorMsg('');
        setSuccessMsg('');
        setOtp('');
        setNewPassword('');
    };

    return (
        <div className="min-h-screen flex w-full font-sans bg-[#F7F8FC]">
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

                <div className="text-center opacity-80">
                    <p className="text-[10px] text-white uppercase tracking-widest leading-relaxed">
                        POWERED BY KOMBALA<br />
                        PLN INDONESIA POWER UBP JAWA TENGAH 2 ADIPALA<br />
                        ALPHA BUILD V1.0
                    </p>
                </div>
            </div>

            <div className="w-full md:w-3/5 lg:w-2/3 flex items-center justify-center p-6 md:p-12 relative">
                <div className="bg-white w-full max-w-[460px] p-8 sm:p-12 rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">

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

                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-start">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-100 flex items-start">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in duration-300">
                            <FormField label="Email">
                                <Input
                                    icon={Mail}
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    required
                                />
                            </FormField>

                            <FormField label="Password">
                                <Input
                                    icon={Lock}
                                    type="password"
                                    name="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <div className="text-right mt-3">
                                    <button
                                        type="button"
                                        onClick={() => { setView('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                                        className="text-sm font-bold text-[#5A2EFF] hover:text-indigo-800 hover:underline transition-all"
                                    >
                                        Lupa Password?
                                    </button>
                                </div>
                            </FormField>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    variant="accent"
                                    size="lg"
                                    className="w-full"
                                    loading={isLoading}
                                >
                                    Masuk Sekarang
                                </Button>
                            </div>
                        </form>
                    )}

                    {view === 'forgot' && (
                        <form onSubmit={handleForgotPassword} className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <FormField label="Email Terdaftar">
                                <Input
                                    icon={Mail}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    required
                                />
                            </FormField>

                            <div className="pt-2 space-y-3">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                    loading={isLoading}
                                    disabled={!email}
                                >
                                    Kirim Kode OTP
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                    onClick={backToLogin}
                                    disabled={isLoading}
                                >
                                    Kembali ke Login
                                </Button>
                            </div>
                        </form>
                    )}

                    {view === 'reset' && (
                        <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right-8 duration-300">
                            <FormField label="Email">
                                <Input
                                    type="email"
                                    value={email}
                                    disabled
                                    inputClassName="bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </FormField>

                            <FormField label="Kode OTP">
                                <Input
                                    type="text"
                                    autoComplete="one-time-code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="123456"
                                    maxLength={6}
                                    inputClassName="text-center tracking-[0.35em] font-bold"
                                    required
                                />
                            </FormField>

                            <FormField label="Password Baru">
                                <Input
                                    icon={Lock}
                                    type="password"
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min. 8 Karakter"
                                    required
                                />
                            </FormField>

                            <div className="pt-2 space-y-3">
                                <Button
                                    type="submit"
                                    variant="accent"
                                    size="lg"
                                    className="w-full"
                                    loading={isLoading}
                                    disabled={!otp || !newPassword}
                                >
                                    Simpan Password Baru
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                    onClick={backToLogin}
                                    disabled={isLoading}
                                >
                                    Batal & Kembali
                                </Button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}
