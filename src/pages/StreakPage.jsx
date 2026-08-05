import { useState, useEffect } from 'react';
import {
    Flame, Plus, Edit, Trash2, Target, Star, Award, Info, ShieldCheck
} from 'lucide-react';
import {
    FormField, Input, Select, Button, Modal, Toast, PageHeader, ConfirmModal
} from '../components/ui';
import { getBaseUrl } from '../utils/apiConfig';
import { isApiSuccess, getApiErrorMessage } from '../utils/apiFeedback';

export default function StreakPage() {
    const [rules, setRules] = useState([]);
    const [badges, setBadges] = useState([]); // STATE UNTUK DROPDOWN BADGE
    const [isLoading, setIsLoading] = useState(true);

    // STATE MODAL
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [selectedRule, setSelectedRule] = useState(null);

    // FORM DATA
    const [formData, setFormData] = useState({
        milestone_days: '',
        xp_reward: '',
        badge_id: '',
        is_active: true
    });

    // FETCH ATURAN STREAK
    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/streak-rules`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                const sortedData = (json.data || []).sort((a, b) => a.milestone_days - b.milestone_days);
                setRules(sortedData);
            } else {
                setRules([]);
            }
        } catch (error) {
            console.error("Gagal mengambil data streak rules", error);
        } finally {
            setIsLoading(false);
        }
    };

    // FETCH BADGES UNTUK DROPDOWN
    const fetchBadges = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/badges`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                // HANYA AMBIL BADGE YANG USE_IN_STREAK == TRUE
                const streakBadges = (json.data.items || []).filter(b => b.use_in_streak === true);
                setBadges(streakBadges);
            }
        } catch (error) {
            console.error("Gagal mengambil data badge", error);
        }
    };

    useEffect(() => {
        fetchRules();
        fetchBadges();
    }, []);

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('success');
        }, 4000);
    };

    // HANDLER MODAL
    const openAddModal = () => {
        setFormData({ milestone_days: '', xp_reward: '', badge_id: '', is_active: true });
        setIsAddModalOpen(true);
    };

    const openEditModal = (rule) => {
        setSelectedRule(rule);
        setFormData({
            milestone_days: rule.milestone_days,
            xp_reward: rule.xp_reward,
            badge_id: rule.badge_id ? rule.badge_id : '',
            is_active: rule.is_active
        });
        setIsEditModalOpen(true);
    };

    const openDetailModal = (rule) => {
        setSelectedRule(rule);
        setIsDetailModalOpen(true);
    };

    const openDeleteModal = (rule) => {
        setSelectedRule(rule);
        setIsDeleteModalOpen(true);
    };

    // FUNGSI SUBMIT (POST & PUT)
    const handleSubmit = async (e, mode) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');

            const payload = {
                milestone_days: Number(formData.milestone_days),
                xp_reward: Number(formData.xp_reward),
                badge_id: formData.badge_id ? Number(formData.badge_id) : null,
                is_active: formData.is_active
            };

            const url = mode === 'add'
                ? `${getBaseUrl()}/admin/streak-rules`
                : `${getBaseUrl()}/admin/streak-rules/${selectedRule.id}`;

            const response = await fetch(url, {
                method: mode === 'add' ? 'POST' : 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const json = await response.json();
            if (isApiSuccess(json)) {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                fetchRules();
                showToast(mode === 'add' ? 'Aturan streak berhasil ditambahkan!' : 'Aturan streak berhasil diperbarui!');
            } else {
                showToast(getApiErrorMessage(json, 'Terjadi kesalahan saat menyimpan aturan.'), 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // FUNGSI DELETE
    const handleDelete = async () => {
        if (!selectedRule) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/streak-rules/${selectedRule.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (isApiSuccess(json)) {
                setIsDeleteModalOpen(false);
                setSelectedRule(null);
                fetchRules();
                showToast('Aturan streak telah dihapus!');
            } else {
                setIsDeleteModalOpen(false);
                setSelectedRule(null);
                showToast(getApiErrorMessage(json, 'Gagal menghapus aturan.'), 'error');
            }
        } catch (error) {
            setIsDeleteModalOpen(false);
            setSelectedRule(null);
            showToast('Terjadi kesalahan jaringan.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // HELPER UNTUK MENDAPATKAN NAMA BADGE DARI ID
    const getBadgeName = (id) => {
        if (!id) return "-";
        const found = badges.find(b => b.id === id);
        return found ? found.name : `Badge #${id}`;
    };

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

            <PageHeader
                title="Aturan Streak"
                subtitle="Atur hadiah EXP dan Badge saat user mencapai target hari berturut-turut"
                actions={
                    <Button icon={Plus} onClick={openAddModal}>
                        Tambah Aturan
                    </Button>
                }
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Total: {rules.length} Aturan</span>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100 font-bold text-gray-600 text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-center w-16">No.</th>
                                <th className="px-6 py-4 text-center">Target Hari (Streak)</th>
                                <th className="px-6 py-4 text-center">Hadiah EXP</th>
                                <th className="px-6 py-4 text-center">Badge Spesial</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Memuat data aturan streak...</td></tr>
                            ) : rules.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Belum ada data aturan.</td></tr>
                            ) : (
                                rules.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800 text-center">{index + 1}</td>
                                        <td className="px-6 py-4 font-black text-orange-500 text-center text-lg">
                                            <div className="flex items-center justify-center space-x-1">
                                                <Flame className="w-5 h-5" /> <span>{item.milestone_days} Hari</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700 text-center">
                                            +{item.xp_reward} EXP
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.badge_id ? (
                                                <span className="px-3 py-1 bg-indigo-50 text-[#5A2EFF] rounded-md text-[10px] font-extrabold uppercase shadow-sm border border-indigo-100">
                                                    {getBadgeName(item.badge_id)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 font-medium text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {item.is_active ? 'AKTIF' : 'OFF'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => openEditModal(item)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => openDeleteModal(item)} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => openDetailModal(item)} className="p-1.5 bg-indigo-50 text-[#5A2EFF] rounded-md hover:bg-indigo-100" title="Detail"><Info className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                open={isAddModalOpen || isEditModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                title={isAddModalOpen ? 'Tambah Aturan Streak' : 'Edit Aturan Streak'}
                subtitle="Tentukan bonus saat pencapaian hari"
                icon={Flame}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                            Batal
                        </Button>
                        <Button type="submit" form="streak-form" variant="primary" loading={isSubmitting}>
                            Simpan Aturan
                        </Button>
                    </>
                }
            >
                <form id="streak-form" onSubmit={(e) => handleSubmit(e, isAddModalOpen ? 'add' : 'edit')} className="admin-form space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Target Hari (Streak)" required>
                            <Input icon={Target} type="number" min="1" required placeholder="Misal: 7" value={formData.milestone_days} onChange={(e) => setFormData({ ...formData, milestone_days: e.target.value })} />
                        </FormField>
                        <FormField label="Hadiah EXP" required>
                            <Input icon={Star} type="number" min="0" required placeholder="Misal: 10" value={formData.xp_reward} onChange={(e) => setFormData({ ...formData, xp_reward: e.target.value })} />
                        </FormField>
                    </div>

                    <FormField label="Pilih Badge Spesial" optional hint='Hanya menampilkan badge yang dikonfigurasi "Use in Streak".'>
                        <Select value={formData.badge_id} onChange={(e) => setFormData({ ...formData, badge_id: e.target.value })}>
                            <option value="">-- Tidak Memberikan Badge --</option>
                            {badges.map(badge => (
                                <option key={badge.id} value={badge.id}>{badge.name} (Tier {badge.tier})</option>
                            ))}
                        </Select>
                    </FormField>

                    <FormField label="Status Aturan">
                        <Select value={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}>
                            <option value="true">Active (Berlaku)</option>
                            <option value="false">Inactive (Dimatikan)</option>
                        </Select>
                    </FormField>
                </form>
            </Modal>

            <Modal
                open={isDetailModalOpen && !!selectedRule}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Streak ${selectedRule?.milestone_days} Hari`}
                icon={Flame}
                size="sm"
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase ${selectedRule?.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {selectedRule?.is_active ? 'Status Aktif' : 'Status Non-Aktif'}
                    </span>
                    <div className="w-full space-y-3">
                        <div className="bg-[#F8F9FC] border border-gray-100 rounded-2xl p-4 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase flex items-center"><Star className="w-4 h-4 mr-2 text-orange-400" /> Hadiah EXP</span>
                            <span className="text-lg font-black text-orange-500">+{selectedRule?.xp_reward}</span>
                        </div>
                        <div className="bg-[#F8F9FC] border border-gray-100 rounded-2xl p-4 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase flex items-center"><ShieldCheck className="w-4 h-4 mr-2 text-[#5A2EFF]" /> Badge</span>
                            {selectedRule?.badge_id ? (
                                <span className="text-sm font-bold text-[#5A2EFF] bg-indigo-50 px-3 py-1 rounded-md">{getBadgeName(selectedRule.badge_id)}</span>
                            ) : (
                                <span className="text-sm font-bold text-gray-400">Tidak ada</span>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                open={isDeleteModalOpen && !!selectedRule}
                onClose={() => { setIsDeleteModalOpen(false); setSelectedRule(null); }}
                onConfirm={handleDelete}
                title="Hapus Aturan Streak?"
                description={`Anda akan menghapus aturan untuk streak ${selectedRule?.milestone_days} Hari. Pengguna tidak akan mendapatkan bonus ini lagi.`}
                confirmLabel="Ya, Hapus"
                loading={isSubmitting}
            />

        </div>
    );
}