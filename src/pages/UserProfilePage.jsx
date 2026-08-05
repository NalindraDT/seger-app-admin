import { useState, useEffect, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    User, Mail, Phone, Calendar, Clock,
    Camera, CheckCircle2, Edit3, ShieldCheck, Info, Save, Crop, Lock, KeyRound, Landmark, Loader2
} from 'lucide-react';
import { PageHeader, Button, FormField, Input, Modal, Toast } from '../components/ui';
import { getBaseUrl } from '../utils/apiConfig';
import { isApiSuccess, getApiErrorMessage } from '../utils/apiFeedback';

export default function UserProfilePage() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

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

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('success');
        }, 4000);
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

            if (isApiSuccess(json)) {
                setProfile(prev => ({
                    ...prev,
                    fullName: editForm.fullName,
                    phoneNumber: editForm.phoneNumber,
                    updatedAt: new Date().toISOString()
                }));
                setIsEditing(false);
                showToast('Profil berhasil diperbarui!');
            } else {
                showToast(getApiErrorMessage(json, 'Gagal memperbarui profil.'), 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan jaringan saat menyimpan profil.', 'error');
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

            if (isApiSuccess(json)) {
                showToast('Foto profil berhasil diperbarui!');
                if (json.data && json.data.profile_photo_url) {
                    setProfile(prev => ({ ...prev, profilePhotoUrl: json.data.profile_photo_url }));
                } else {
                    await fetchProfile();
                }
                setIsCropModalOpen(false);
            } else {
                showToast(getApiErrorMessage(json, 'Gagal mengunggah foto profil.'), 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Terjadi kesalahan saat memproses atau mengunggah foto.', 'error');
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

            if (isApiSuccess(json)) {
                // Buka Modal & Set Pesan Sukses
                setOtp('');
                setNewPassword('');
                setAuthMessage({ type: 'success', text: 'Kode OTP telah dikirim ke email Anda.' });
                setIsPasswordModalOpen(true);
            } else {
                showToast(getApiErrorMessage(json, 'Gagal meminta reset password.'), 'error');
            }
        } catch (error) {
            showToast('Kesalahan jaringan saat meminta kode OTP.', 'error');
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

            if (isApiSuccess(json)) {
                setIsPasswordModalOpen(false);
                showToast('Password Anda berhasil diubah!');
                setOtp('');
                setNewPassword('');
            } else {
                setAuthMessage({ type: 'error', text: getApiErrorMessage(json, 'Gagal mengubah password. Pastikan OTP benar.') });
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
        <div className="relative mx-auto max-w-4xl space-y-6">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

            <PageHeader
                title="Profil Saya"
                subtitle="Kelola informasi pribadi dan keamanan akun Anda"
            />

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
                                    <Button variant="secondary" onClick={handleCancelEdit} disabled={isSaving}>
                                        Batal
                                    </Button>
                                    <Button variant="success" icon={Save} onClick={handleSaveProfile} loading={isSaving} disabled={!editForm.fullName.trim()}>
                                        Simpan Perubahan
                                    </Button>
                                </>
                            ) : (
                                <Button variant="secondary" icon={Edit3} onClick={handleEditClick}>
                                    Edit Profil
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mb-8 max-w-xl admin-form">
                        {isEditing ? (
                            <FormField label="Nama Lengkap" required className="mb-2">
                                <Input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    inputClassName="text-xl font-bold"
                                    placeholder="Masukkan nama lengkap..."
                                    autoFocus
                                />
                            </FormField>
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

                        <div className="rounded-2xl border border-gray-100 bg-[#F8F9FC] p-4">
                            {isEditing ? (
                                <FormField label="Nomor Telepon">
                                    <Input
                                        type="tel"
                                        icon={Phone}
                                        value={editForm.phoneNumber}
                                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </FormField>
                            ) : (
                                <>
                                    <label className="mb-2 flex items-center text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                        <Phone className="mr-1.5 h-3.5 w-3.5" /> Nomor Telepon
                                    </label>
                                    <p className="text-sm font-bold text-gray-900">
                                        {profile.phoneNumber ? profile.phoneNumber : <span className="italic text-gray-400">Belum diatur</span>}
                                    </p>
                                </>
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
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={KeyRound}
                            onClick={handleRequestOtp}
                            loading={isProcessingAuth}
                        >
                            Ubah Password
                        </Button>
                    </div>

                </div>
            </div>

            <Modal
                open={isCropModalOpen && !!imgSrc}
                onClose={() => { setIsCropModalOpen(false); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                title="Sesuaikan Foto"
                subtitle="Geser kotak untuk menyesuaikan porsi gambar"
                icon={Crop}
                size="md"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => { setIsCropModalOpen(false); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            disabled={isUploadingPhoto}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1"
                            onClick={handleUploadCroppedImage}
                            loading={isUploadingPhoto}
                            disabled={!completedCrop?.width || !completedCrop?.height}
                        >
                            Simpan & Unggah
                        </Button>
                    </>
                }
            >
                <div className="flex justify-center overflow-auto rounded-xl border border-gray-200 bg-gray-900/5">
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
                            alt="Crop preview"
                            onLoad={onImageLoad}
                            className="max-h-[50vh] object-contain"
                        />
                    </ReactCrop>
                </div>
            </Modal>

            <Modal
                open={isPasswordModalOpen}
                onClose={() => { setIsPasswordModalOpen(false); setAuthMessage({ type: '', text: '' }); }}
                title="Ubah Password"
                subtitle="Konfirmasi via OTP Email"
                icon={Lock}
                size="sm"
                footer={
                    <Button
                        type="submit"
                        form="password-form"
                        variant="accent"
                        className="w-full"
                        loading={isProcessingAuth}
                        disabled={!otp || !newPassword}
                    >
                        Simpan Password Baru
                    </Button>
                }
            >
                <form id="password-form" onSubmit={handleResetPassword} className="admin-form space-y-4">
                    {authMessage.text && (
                        <div className={`flex items-start rounded-xl p-3 text-xs font-bold ${authMessage.type === 'error' ? 'border border-red-100 bg-red-50 text-red-600' : 'border border-green-100 bg-green-50 text-green-700'}`}>
                            {authMessage.type === 'error' ? <Info className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" /> : <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />}
                            <span>{authMessage.text}</span>
                        </div>
                    )}

                    <FormField
                        label="Kode OTP"
                        required
                        hint={<>Cek kotak masuk atau folder spam di email <strong>{profile?.email}</strong>.</>}
                    >
                        <Input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            inputClassName="text-center text-lg font-black tracking-[0.5em]"
                            placeholder="123456"
                            maxLength={6}
                            required
                            autoComplete="off"
                        />
                    </FormField>

                    <FormField label="Password Baru" required hint="Minimal 8 karakter">
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimal 8 Karakter"
                            required
                            autoComplete="new-password"
                        />
                    </FormField>
                </form>
            </Modal>

        </div>
    );
}