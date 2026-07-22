import { useState, useEffect, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    User, Mail, Phone, Calendar, Clock,
    Camera, CheckCircle2, Edit3, ShieldCheck, Info, X, Save, Loader2, Crop, Lock, KeyRound, Eye, Landmark
} from 'lucide-react';
import { getBaseUrl } from '../utils/apiConfig';

export default function UserProfilePage() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');

    // STATE UNTUK EDIT PROFIL (PATCH)
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '' });

    // STATE & REF UNTUK UPLOAD FOTO & CROP (PUT)
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);
    
    // STATE CROPPER
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);

    // STATE UBAH PASSWORD (OTP)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isProcessingAuth, setIsProcessingAuth] = useState(false);
    const [authMessage, setAuthMessage] = useState({ type: '', text: '' });
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                setProfile(json.data);
                setEditForm({
                    fullName: json.data.fullName || '',
                    phoneNumber: json.data.phoneNumber || ''
                });
            }
        } catch (error) {
            console.error("Gagal mengambil data profil", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 4000);
    };

    // HANDLER EDIT PROFIL (PATCH)
    const handleEditClick = () => setIsEditing(true);

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({
            fullName: profile.fullName || '',
            phoneNumber: profile.phoneNumber || ''
        });
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const payload = { full_name: editForm.fullName, phone_number: editForm.phoneNumber };

            const response = await fetch(`${getBaseUrl()}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const json = await response.json();

            if (json.success || json.status === 'success') {
                setProfile(prev => ({
                    ...prev,
                    fullName: editForm.fullName,
                    phoneNumber: editForm.phoneNumber,
                    updatedAt: new Date().toISOString()
                }));
                setIsEditing(false);
                showToast('Profil berhasil diperbarui!');
            } else {
                alert(json.message || "Gagal memperbarui profil.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan saat menyimpan profil.");
        } finally {
            setIsSaving(false);
        }
    };

    // HANDLER UPLOAD FOTO
    const handleSelectFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '');
                setIsCropModalOpen(true);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const crop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
            width,
            height
        );
        setCrop(crop);
    };

    const getCroppedImg = async (image, crop, fileName) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                blob.name = fileName;
                resolve(blob);
            }, 'image/jpeg', 1);
        });
    };

    const handleUploadCroppedImage = async () => {
        if (!completedCrop || !imgRef.current) return;

        setIsUploadingPhoto(true);
        try {
            const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, 'profile-cropped.jpg');
            const token = localStorage.getItem('jwt_token');
            const formData = new FormData();
            formData.append('photo', croppedBlob, 'profile-cropped.jpg');

            const response = await fetch(`${getBaseUrl()}/users/profile/photo`, {
                method: 'PUT', 
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const json = await response.json();

            if (json.success || json.status === 'success') {
                showToast('Foto profil berhasil diperbarui!');
                if (json.data && json.data.profile_photo_url) {
                    setProfile(prev => ({ ...prev, profilePhotoUrl: json.data.profile_photo_url }));
                } else {
                    await fetchProfile();
                }
                setIsCropModalOpen(false);
            } else {
                alert(json.message || "Gagal mengunggah foto profil.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat memproses atau mengunggah foto.");
        } finally {
            setIsUploadingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ==========================================
    // BAGIAN UBAH PASSWORD (OTP FLOW)
    // ==========================================

    const handleRequestOtp = async () => {
        if (!profile?.email) return;
        setIsProcessingAuth(true);
        try {
            const response = await fetch(`${getBaseUrl()}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: profile.email }),
            });
            const json = await response.json();

            if (response.ok && json.success) {
                // Buka Modal & Set Pesan Sukses
                setOtp('');
                setNewPassword('');
                setAuthMessage({ type: 'success', text: 'Kode OTP telah dikirim ke email Anda.' });
                setIsPasswordModalOpen(true);
            } else {
                alert(json.message || 'Gagal meminta reset password.');
            }
        } catch (error) {
            alert('Kesalahan jaringan saat meminta kode OTP.');
        } finally {
            setIsProcessingAuth(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsProcessingAuth(true);
        setAuthMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${getBaseUrl()}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: profile.email, 
                    otp: otp, 
                    new_password: newPassword 
                }),
            });

            const json = await response.json();

            if (response.ok && json.success) {
                setIsPasswordModalOpen(false);
                showToast('Password Anda berhasil diubah!');
                setOtp('');
                setNewPassword('');
            } else {
                setAuthMessage({ type: 'error', text: json.message || 'Gagal mengubah password. Pastikan OTP benar.' });
            }
        } catch (error) {
            setAuthMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
        } finally {
            setIsProcessingAuth(false);
        }
    };

    // ==========================================

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
    };

    if (isLoading && !profile) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-gray-500 font-medium animate-pulse flex flex-col items-center">
                    <User className="w-10 h-10 mb-3 text-gray-300" />
                    Memuat data profil...
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-red-500 font-bold">
                Gagal memuat profil. Silakan coba lagi.
            </div>
        );
    }

    return (
        <div className="space-y-6 relative max-w-4xl mx-auto">
            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-white border border-green-100 shadow-xl rounded-xl p-4 flex items-center space-x-3 pr-6">
                        <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle2 className="w-5 h-5 text-[#10B981]" /></div>
                        <div><p className="text-sm font-extrabold text-gray-900">Sukses</p><p className="text-xs font-medium text-gray-500">{toastMessage}</p></div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Profil Saya</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola informasi pribadi dan keamanan akun Anda</p>
            </div>

            {/* KARTU PROFIL UTAMA */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">

                <div className="h-32 md:h-40 bg-gradient-to-r from-[#5A2EFF] to-[#7F56D9] relative">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                </div>

                <div className="px-8 pb-8 relative">

                    <div className="relative -mt-16 md:-mt-20 mb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                        <div className="relative group w-max">
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full p-1.5 shadow-lg border border-gray-100 relative overflow-hidden">
                                {isUploadingPhoto ? (
                                    <div className="w-full h-full rounded-full bg-gray-100 flex flex-col items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-[#5A2EFF] animate-spin mb-2" />
                                        <span className="text-[10px] font-bold text-gray-500">Upload...</span>
                                    </div>
                                ) : (
                                    <img
                                        src={profile.profilePhotoUrl || `https://ui-avatars.com/api/?name=${profile.fullName}&background=F3F4F6&color=5A2EFF&size=256`}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover bg-gray-50"
                                    />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={isUploadingPhoto || isEditing}
                                className="absolute bottom-2 right-2 p-2.5 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors border-2 border-white disabled:opacity-50"
                                title="Ganti Foto Profil"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleSelectFile}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div className="flex items-center space-x-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                        className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors flex items-center shadow-sm disabled:opacity-50"
                                    >
                                        <X className="w-4 h-4 mr-2" /> Batal
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving || !editForm.fullName.trim()}
                                        className="px-5 py-2.5 bg-[#10B981] text-white font-bold text-sm rounded-xl hover:bg-green-600 transition-colors flex items-center shadow-sm disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Simpan Perubahan
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleEditClick}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors flex items-center shadow-sm border border-gray-200"
                                >
                                    <Edit3 className="w-4 h-4 mr-2" /> Edit Profil
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mb-8 max-w-xl">
                        {isEditing ? (
                            <div className="mb-2">
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="text-3xl font-black text-gray-900 tracking-tight w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                    placeholder="Masukkan nama lengkap..."
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                                {profile.fullName}
                                {profile.isActive && <CheckCircle2 className="w-6 h-6 text-[#10B981] ml-2" />}
                            </h2>
                        )}

                        <div className="flex items-center mt-3 space-x-3">
                            <span className="px-3 py-1 bg-indigo-50 text-[#5A2EFF] font-black text-[10px] uppercase tracking-widest rounded-md border border-indigo-100 flex items-center">
                                <ShieldCheck className="w-3 h-3 mr-1.5" />
                                {profile.role}
                            </span>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                                <Mail className="w-4 h-4 mr-1.5" /> {profile.email}
                            </span>
                        </div>
                    </div>

                    <hr className="border-gray-100 mb-8" />

                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Informasi Pribadi</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#F8F9FC] rounded-2xl p-4 border border-gray-100">
                            <label className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                                <Mail className="w-3.5 h-3.5 mr-1.5" /> Alamat Email
                            </label>
                            <p className="text-sm font-bold text-gray-900">{profile.email}</p>
                            {profile.emailVerifiedAt ? (
                                <span className="text-[10px] text-green-600 font-bold mt-1 block">✔ Terverifikasi</span>
                            ) : (
                                <span className="text-[10px] text-orange-500 font-bold mt-1 block">⚠ Belum Terverifikasi</span>
                            )}
                        </div>

                        <div className="bg-[#F8F9FC] rounded-2xl p-4 border border-gray-100">
                            <label className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                                <Phone className="w-3.5 h-3.5 mr-1.5" /> Nomor Telepon
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={editForm.phoneNumber}
                                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                    className="text-sm font-bold text-gray-900 w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                    placeholder="08xxxxxxxxxx"
                                />
                            ) : (
                                <p className="text-sm font-bold text-gray-900">
                                    {profile.phoneNumber ? profile.phoneNumber : <span className="text-gray-400 italic">Belum diatur</span>}
                                </p>
                            )}
                        </div>

                        <div className="bg-[#F8F9FC] rounded-2xl p-4 border border-gray-100">
                            <label className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                                <Landmark className="w-3.5 h-3.5 mr-1.5" /> Perusahaan
                            </label>
                            <p className="text-sm font-bold text-gray-900">
                                {profile.companyName || profile.company?.name
                                    ? (profile.companyName || profile.company?.name)
                                    : <span className="text-gray-400 italic">Belum diatur</span>}
                            </p>
                        </div>

                        <div className="bg-[#F8F9FC] rounded-2xl p-4 border border-gray-100">
                            <label className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                                <Calendar className="w-3.5 h-3.5 mr-1.5" /> Bergabung Sejak
                            </label>
                            <p className="text-sm font-bold text-gray-900">{formatDate(profile.createdAt)}</p>
                        </div>

                        <div className="bg-[#F8F9FC] rounded-2xl p-4 border border-gray-100">
                            <label className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                                <Clock className="w-3.5 h-3.5 mr-1.5" /> Terakhir Diperbarui
                            </label>
                            <p className="text-sm font-bold text-gray-900">{formatDate(profile.updatedAt)}</p>
                        </div>
                    </div>

                    {/* SEKSI KEAMANAN AKUN (UBAH PASSWORD) */}
                    <h3 className="text-sm font-bold text-gray-900 mt-10 mb-4 uppercase tracking-wide">Keamanan Akun</h3>
                    
                    <div className="bg-[#F8F9FC] rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-sm">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-gray-900">Ubah Password</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Kami akan mengirimkan kode OTP ke email Anda</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRequestOtp}
                            disabled={isProcessingAuth}
                            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm disabled:opacity-50 flex items-center"
                        >
                            {isProcessingAuth ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                            {isProcessingAuth ? 'Memproses...' : 'Ubah Password'}
                        </button>
                    </div>

                </div>
            </div>

            {/* ========================================== */}
            {/* MODAL CROP GAMBAR                          */}
            {/* ========================================== */}
            {isCropModalOpen && !!imgSrc && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-indigo-50 text-[#5A2EFF] rounded-full flex items-center justify-center">
                                    <Crop className="w-4 h-4" />
                                </div>
                                <h2 className="text-sm font-extrabold text-gray-900">Sesuaikan Foto</h2>
                            </div>
                            <button 
                                onClick={() => { setIsCropModalOpen(false); if(fileInputRef.current) fileInputRef.current.value = ''; }} 
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 bg-[#F8F9FC] flex flex-col items-center justify-center">
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-4 text-center">
                                Geser kotak untuk menyesuaikan porsi gambar
                            </p>
                            
                            <div className="max-h-[50vh] overflow-auto w-full flex justify-center bg-gray-900/5 rounded-xl border border-gray-200">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1}
                                    circularCrop 
                                >
                                    <img 
                                        ref={imgRef}
                                        src={imgSrc} 
                                        alt="Crop me" 
                                        onLoad={onImageLoad} 
                                        className="max-h-[50vh] object-contain"
                                    />
                                </ReactCrop>
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-100 bg-white flex space-x-3">
                            <button 
                                type="button" 
                                onClick={() => { setIsCropModalOpen(false); if(fileInputRef.current) fileInputRef.current.value = ''; }} 
                                disabled={isUploadingPhoto} 
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                type="button" 
                                onClick={handleUploadCroppedImage} 
                                disabled={!completedCrop?.width || !completedCrop?.height || isUploadingPhoto} 
                                className="flex-1 px-4 py-3 rounded-xl bg-[#5A2EFF] text-white font-bold hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center"
                            >
                                {isUploadingPhoto ? 'Mengunggah...' : 'Simpan & Unggah'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* MODAL UBAH PASSWORD (OTP)                  */}
            {/* ========================================== */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col border border-gray-100">
                        
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-rose-50/30">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center border border-rose-200">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-extrabold text-gray-900">Ubah Password</h2>
                                    <p className="text-[10px] font-medium text-gray-500">Konfirmasi via OTP Email</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setIsPasswordModalOpen(false); setAuthMessage({type: '', text: ''}); }} 
                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleResetPassword} className="p-6 space-y-5 bg-white">
                            
                            {/* Notifikasi Dalam Modal */}
                            {authMessage.text && (
                                <div className={`p-3 rounded-xl text-xs font-bold flex items-start ${authMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                    {authMessage.type === 'error' ? <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />}
                                    <span>{authMessage.text}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Kode OTP</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-center tracking-[0.5em] text-lg font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                    placeholder="123456"
                                    maxLength={6}
                                    required
                                    autoComplete="off"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 text-center">Cek kotak masuk atau folder spam di email <strong>{profile?.email}</strong>.</p>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Password Baru</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-4 pr-12 py-3 bg-[#F8F9FC] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2EFF] transition-all"
                                        placeholder="Minimal 8 Karakter"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#5A2EFF] transition-colors"
                                    >
                                        {showNewPassword ? <Eye className="w-4 h-4" /> : <Info className="w-4 h-4" />} {/* Gunakan ikon mata coret jika ada, sementara pakai Info/Eye */}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={isProcessingAuth || !otp || !newPassword} 
                                    className="w-full py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-sm transition-colors flex items-center justify-center disabled:opacity-50"
                                >
                                    {isProcessingAuth ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    {isProcessingAuth ? 'Menyimpan...' : 'Simpan Password Baru'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

        </div>
    );
}