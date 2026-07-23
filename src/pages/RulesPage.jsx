import { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, MapPin, Scale
} from 'lucide-react';
import {
    FormField, Input, Select, Button, Modal, SearchBar, Toast, PageHeader, ConfirmModal
} from '../components/ui';
import { getBaseUrl } from '../utils/apiConfig';

const THRESHOLD_FIELD_LABELS = {
    distance_km: 'Jarak (km)',
    duration_minutes: 'Durasi (menit)',
    duration_seconds: 'Detik',
    calories: 'Kalori (kcal)',
    steps: 'Langkah',
    elevation_m: 'Elevasi (meter)',
};

const getThresholdFieldsForActivity = (activity) => {
    const fields = activity?.input_fields ?? [];
    const numericFields = fields.filter((field) => field.type === 'number');
    if (numericFields.length > 0) {
        return numericFields.map((field) => ({
            key: field.key,
            label: THRESHOLD_FIELD_LABELS[field.key] ?? field.label ?? field.key,
            unit: field.unit ?? '',
        }));
    }
    return [{ key: 'distance_km', label: THRESHOLD_FIELD_LABELS.distance_km, unit: 'km' }];
};

const defaultThresholdFieldForActivity = (activity) => {
    const fields = getThresholdFieldsForActivity(activity);
    const preferred = ['distance_km', 'duration_minutes', 'calories', 'steps'];
    for (const key of preferred) {
        if (fields.some((field) => field.key === key)) return key;
    }
    return fields[0]?.key ?? 'distance_km';
};

const formatThresholdLabel = (fieldKey) => THRESHOLD_FIELD_LABELS[fieldKey] ?? fieldKey;

export default function RulesPage() {
    const [activeTab, setActiveTab] = useState('exp');
    const [rules, setRules] = useState([]);
    const [activityTypes, setActivityTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedRuleId, setSelectedRuleId] = useState(null);
    const [selectedActivityName, setSelectedActivityName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState(null);

    const [formData, setFormData] = useState({
        activity_type_id: '',
        threshold_field: 'distance_km',
        min_value: '',
        reward_amount: '',
        is_active: true
    });

    const selectedActivityForForm = activityTypes.find(
        (act) => String(act.id) === String(formData.activity_type_id)
    );
    const thresholdFieldOptions = getThresholdFieldsForActivity(selectedActivityForForm);
    const selectedThresholdMeta = thresholdFieldOptions.find((field) => field.key === formData.threshold_field)
        ?? thresholdFieldOptions[0];

    const fetchActivityTypes = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/activity-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) setActivityTypes(json.data);
        } catch (error) {
            console.error("Gagal mengambil data tipe aktifitas", error);
        }
    };

    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const endpoint = activeTab === 'exp' ? 'xp-rules' : 'point-rules';

            const response = await fetch(`${getBaseUrl()}/admin/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();

            if (json.success) {
                setRules(json.data);
            } else {
                setRules([]);
            }
        } catch (error) {
            console.error(`Gagal mengambil data ${activeTab} rules`, error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivityTypes();
    }, []);

    useEffect(() => {
        fetchRules();
    }, [activeTab]);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const getActivityName = (id) => {
        const activity = activityTypes.find(act => act.id === id);
        return activity ? activity.name : `ID: ${id}`;
    };

    const availableActivityTypes = activityTypes.filter(act =>
        !rules.some(rule => rule.activity_type_id === act.id)
    );

    const openAddModal = () => {
        setModalMode('add');
        const defaultActivity = availableActivityTypes[0] ?? null;
        setFormData({
            activity_type_id: defaultActivity ? defaultActivity.id : '',
            threshold_field: defaultThresholdFieldForActivity(defaultActivity),
            min_value: '',
            reward_amount: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (rule) => {
        setModalMode('edit');
        setSelectedRuleId(rule.id);
        setSelectedActivityName(getActivityName(rule.activity_type_id));
        const activity = activityTypes.find((act) => act.id === rule.activity_type_id);
        setFormData({
            activity_type_id: rule.activity_type_id,
            threshold_field: rule.threshold_field ?? defaultThresholdFieldForActivity(activity),
            min_value: rule.min_value ?? rule.min_distance_km,
            reward_amount: activeTab === 'exp' ? rule.xp_awarded : rule.points_awarded,
            is_active: rule.is_active
        });
        setIsModalOpen(true);
    };

    const handleActivityTypeChange = (activityTypeId) => {
        const activity = activityTypes.find((act) => String(act.id) === String(activityTypeId));
        setFormData((prev) => ({
            ...prev,
            activity_type_id: activityTypeId,
            threshold_field: defaultThresholdFieldForActivity(activity),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('jwt_token');
            const endpoint = activeTab === 'exp' ? 'xp-rules' : 'point-rules';

            let url = `${getBaseUrl()}/admin/${endpoint}`;
            let method = 'POST';
            let payload = {};

            if (modalMode === 'add') {
                payload = {
                    activity_type_id: Number(formData.activity_type_id),
                    threshold_field: formData.threshold_field,
                    min_value: Number(formData.min_value),
                    is_active: formData.is_active
                };
            } else {
                url = `${url}/${selectedRuleId}`;
                method = 'PUT';
                payload = {
                    threshold_field: formData.threshold_field,
                    min_value: Number(formData.min_value),
                    is_active: formData.is_active
                };
            }

            if (activeTab === 'exp') {
                payload.xp_awarded = Number(formData.reward_amount);
            } else {
                payload.points_awarded = Number(formData.reward_amount);
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            const json = await response.json();

            if (json.success || json.status === 'success') {
                closeModal();
                fetchRules();
                showToast(modalMode === 'add' ? `Aturan ${activeTab.toUpperCase()} berhasil ditambahkan!` : `Aturan ${activeTab.toUpperCase()} berhasil diperbarui!`);
            } else {
                alert(json.message || "Terjadi kesalahan saat menyimpan data.");
            }
        } catch (error) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!ruleToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const endpoint = activeTab === 'exp' ? 'xp-rules' : 'point-rules';
            const response = await fetch(`${getBaseUrl()}/admin/${endpoint}/${ruleToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success || json.status === 'success') {
                setIsDeleteModalOpen(false);
                setRuleToDelete(null);
                fetchRules();
                showToast(`Aturan ${activeTab.toUpperCase()} berhasil dihapus!`);
            }
        } catch (error) {
            alert("Gagal menghapus data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const filteredRules = rules.filter(rule => {
        const name = getActivityName(rule.activity_type_id).toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    const modalTitle = modalMode === 'add'
        ? `Tambah Rules ${activeTab === 'exp' ? 'Exp' : 'Poin'}`
        : `Edit Rules ${activeTab === 'exp' ? 'Exp' : 'Poin'} (${selectedActivityName})`;

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />

            <PageHeader
                title="Aturan EXP dan Poin"
                subtitle="Halaman pengaturan aturan pendapatan exp dan point berdasarkan suatu aktifitas"
            />

            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    <button onClick={() => { setActiveTab('exp'); setSearchTerm(''); }} className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors ${activeTab === 'exp' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Aturan EXP
                    </button>
                    <button onClick={() => { setActiveTab('point'); setSearchTerm(''); }} className={`py-3.5 px-1 font-bold text-sm border-b-2 transition-colors ${activeTab === 'point' ? 'border-[#5A2EFF] text-[#5A2EFF]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Aturan Poin
                    </button>
                </nav>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SearchBar
                    label="Cari Aturan"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari aktifitas"
                    className="w-full sm:max-w-xs"
                />
                <Button icon={Plus} onClick={openAddModal}>
                    {activeTab === 'exp' ? 'Tambah Aturan EXP' : 'Tambah Aturan Poin'}
                </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center w-16">No</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center">Nama Aktifitas</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center">Parameter Minimum</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center">Nilai Minimum</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center">{activeTab === 'exp' ? 'Hadiah EXP' : 'Hadiah poin'}</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center w-32">Status</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-xs text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Memuat data aturan...</td></tr>
                            ) : filteredRules.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500 font-medium">Tidak ada data aturan.</td></tr>
                            ) : (
                                filteredRules.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800 text-center">{index + 1}</td>
                                        <td className="px-6 py-4 font-extrabold text-gray-900 text-center">{getActivityName(item.activity_type_id)}</td>
                                        <td className="px-6 py-4 font-bold text-gray-700 text-center">{formatThresholdLabel(item.threshold_field ?? 'distance_km')}</td>
                                        <td className="px-6 py-4 font-bold text-gray-700 text-center">{item.min_value ?? item.min_distance_km}</td>
                                        <td className="px-6 py-4 font-bold text-gray-700 text-center">{activeTab === 'exp' ? item.xp_awarded : item.points_awarded}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {item.is_active ? 'AKTIF' : 'NONAKTIF'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-center space-x-2">
                                            <button onClick={() => openEditModal(item)} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => { setRuleToDelete(item); setIsDeleteModalOpen(true); }} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                open={isModalOpen}
                onClose={closeModal}
                title={modalTitle}
                icon={Scale}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" className="flex-1" onClick={closeModal} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="rules-form"
                            variant="success"
                            className="flex-1"
                            loading={isSubmitting}
                            disabled={modalMode === 'add' && availableActivityTypes.length === 0}
                        >
                            Simpan
                        </Button>
                    </>
                }
            >
                <form id="rules-form" onSubmit={handleSubmit} className="admin-form space-y-4">
                    {modalMode === 'add' && (
                        <FormField label="Kode Aktifitas" required>
                            <Select
                                required
                                value={formData.activity_type_id}
                                onChange={(e) => handleActivityTypeChange(e.target.value)}
                            >
                                {availableActivityTypes.length === 0 ? (
                                    <option value="" disabled>Semua aktifitas sudah memiliki aturan</option>
                                ) : (
                                    <option value="" disabled>Pilih Aktifitas</option>
                                )}
                                {availableActivityTypes.map(act => (
                                    <option key={act.id} value={act.id}>{act.name} ({act.code})</option>
                                ))}
                            </Select>
                        </FormField>
                    )}

                    <FormField label="Parameter Minimum" required>
                        <Select
                            required
                            value={formData.threshold_field}
                            onChange={(e) => setFormData({ ...formData, threshold_field: e.target.value })}
                        >
                            {thresholdFieldOptions.map((field) => (
                                <option key={field.key} value={field.key}>{field.label}</option>
                            ))}
                        </Select>
                    </FormField>

                    <FormField
                        label={`Nilai Minimum${selectedThresholdMeta?.unit ? ` (${selectedThresholdMeta.unit})` : ''}`}
                        required
                        hint={activeTab === 'exp' ? `EXP dihitung per kelipatan nilai minimum (mis. ${formData.min_value || 'X'} ${selectedThresholdMeta?.unit || ''} = 1 unit hadiah).` : undefined}
                    >
                        <Input
                            icon={MapPin}
                            type="number"
                            step="0.1"
                            min="0"
                            required
                            placeholder="0"
                            value={formData.min_value}
                            onChange={(e) => setFormData({ ...formData, min_value: e.target.value })}
                        />
                    </FormField>

                    <FormField label={activeTab === 'exp' ? 'Hadiah EXP' : 'Hadiah Poin'} required>
                        <Input
                            suffix={activeTab === 'exp' ? 'XP' : undefined}
                            type="number"
                            min="0"
                            required
                            placeholder="0"
                            value={formData.reward_amount}
                            onChange={(e) => setFormData({ ...formData, reward_amount: e.target.value })}
                        />
                    </FormField>

                    <FormField label="Status">
                        <Select
                            value={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </Select>
                    </FormField>
                </form>
            </Modal>

            <ConfirmModal
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDelete}
                title="Hapus Aturan?"
                description="Anda akan menghapus aturan ini. Pengguna tidak akan mendapatkan hadiah yang sesuai untuk aktifitas ini lagi."
                confirmLabel="Ya, Hapus"
                loading={isSubmitting}
            />
        </div>
    );
}
