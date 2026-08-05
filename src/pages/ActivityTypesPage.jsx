import { useState, useEffect } from 'react';
import {
    Plus, Edit, Activity, Trash2
} from 'lucide-react';
import {
    FormField, Input, Select, Button, Modal, SearchBar, Toast, PageHeader, ConfirmModal, CheckboxCard, SortableTh
} from '../components/ui';
import { useTableSort } from '../hooks/useTableSort';
import { getBaseUrl } from '../utils/apiConfig';
import { isApiSuccess, getApiErrorMessage } from '../utils/apiFeedback';

const FIELD_OPTIONS = [
    { key: 'distance_km', label: 'Jarak', type: 'number', unit: 'km', required: true },
    { key: 'duration_minutes', label: 'Durasi', type: 'number', unit: 'menit', required: true },
    { key: 'duration_seconds', label: 'Detik', type: 'number', unit: 'detik', required: false },
    { key: 'calories', label: 'Kalori', type: 'number', unit: 'kcal', required: false },
    { key: 'steps', label: 'Langkah', type: 'number', unit: 'langkah', required: false },
    { key: 'elevation_m', label: 'Elevasi', type: 'number', unit: 'meter', required: false },
];

const OUTPUT_OPTIONS = [
    { key: 'pace', label: 'Pace', formula: 'pace', unit: 'min/km' },
    { key: 'speed', label: 'Kecepatan', formula: 'speed', unit: 'km/jam' },
    { key: 'pace_100m', label: 'Pace/100m', formula: 'pace_100m', unit: 'min/100m' },
    { key: 'calories_per_hour', label: 'Kalori/jam', formula: 'calories_per_hour', unit: 'kcal/jam' },
    { key: 'steps_per_km', label: 'Langkah/km', formula: 'steps_per_km', unit: 'langkah/km' },
];

const ACTIVITY_PRESETS = {
    running: {
        label: 'Lari',
        input_fields: ['distance_km', 'duration_minutes', 'duration_seconds'],
        output_metrics: ['pace'],
    },
    walking: {
        label: 'Jalan',
        input_fields: ['distance_km', 'duration_minutes'],
        output_metrics: ['pace'],
    },
    cycling: {
        label: 'Sepeda',
        input_fields: ['distance_km', 'duration_minutes'],
        output_metrics: ['speed'],
    },
    swimming: {
        label: 'Renang',
        input_fields: ['distance_km', 'duration_minutes'],
        output_metrics: ['pace_100m'],
    },
    gym: {
        label: 'Gym/Fitness',
        input_fields: ['duration_minutes', 'calories'],
        output_metrics: ['calories_per_hour'],
    },
    hiking: {
        label: 'Hiking',
        input_fields: ['distance_km', 'duration_minutes', 'elevation_m'],
        output_metrics: ['pace'],
    },
    custom: {
        label: 'Custom',
        input_fields: ['distance_km', 'duration_minutes'],
        output_metrics: [],
    },
};

const buildFieldsFromKeys = (keys) =>
    keys.map((key) => FIELD_OPTIONS.find((field) => field.key === key)).filter(Boolean);

const buildMetricsFromKeys = (keys) =>
    keys.map((key) => OUTPUT_OPTIONS.find((metric) => metric.key === key)).filter(Boolean);

export default function ActivityTypesPage() {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedId, setSelectedId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        is_active: true,
        preset: 'running',
        input_fields: buildFieldsFromKeys(ACTIVITY_PRESETS.running.input_fields),
        output_metrics: buildMetricsFromKeys(ACTIVITY_PRESETS.running.output_metrics),
    });

    const applyPreset = (presetKey) => {
        const preset = ACTIVITY_PRESETS[presetKey];
        if (!preset) return;
        setFormData((prev) => ({
            ...prev,
            preset: presetKey,
            input_fields: buildFieldsFromKeys(preset.input_fields),
            output_metrics: buildMetricsFromKeys(preset.output_metrics),
        }));
    };

    const toggleInputField = (fieldKey) => {
        setFormData((prev) => {
            const exists = prev.input_fields.some((field) => field.key === fieldKey);
            if (exists) {
                return {
                    ...prev,
                    preset: 'custom',
                    input_fields: prev.input_fields.filter((field) => field.key !== fieldKey),
                };
            }
            const option = FIELD_OPTIONS.find((field) => field.key === fieldKey);
            if (!option) return prev;
            return {
                ...prev,
                preset: 'custom',
                input_fields: [...prev.input_fields, option],
            };
        });
    };

    const toggleOutputMetric = (metricKey) => {
        setFormData((prev) => {
            const exists = prev.output_metrics.some((metric) => metric.key === metricKey);
            if (exists) {
                return {
                    ...prev,
                    preset: 'custom',
                    output_metrics: prev.output_metrics.filter((metric) => metric.key !== metricKey),
                };
            }
            const option = OUTPUT_OPTIONS.find((metric) => metric.key === metricKey);
            if (!option) return prev;
            return {
                ...prev,
                preset: 'custom',
                output_metrics: [...prev.output_metrics, option],
            };
        });
    };

    const fetchActivities = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/activity-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (json.success) setActivities(json.data);
        } catch (error) {
            console.error("Gagal mengambil data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => {
            setToastMessage('');
            setToastType('success');
        }, 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const url = modalMode === 'add'
                ? `${getBaseUrl()}/admin/activity-types`
                : `${getBaseUrl()}/admin/activity-types/${selectedId}`;

            const response = await fetch(url, {
                method: modalMode === 'add' ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const json = await response.json();
            if (isApiSuccess(json)) {
                closeModal();
                fetchActivities();
                showToast(modalMode === 'add' ? 'Tipe aktifitas berhasil ditambah!' : 'Tipe aktifitas berhasil diperbarui!');
            } else {
                showToast(getApiErrorMessage(json, 'Gagal memproses data.'), 'error');
            }
        } catch (error) {
            showToast('Gagal memproses data.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!activityToDelete) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch(`${getBaseUrl()}/admin/activity-types/${activityToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await response.json();
            if (isApiSuccess(json)) {
                setIsDeleteModalOpen(false);
                setActivityToDelete(null);
                fetchActivities();
                showToast('Tipe aktifitas berhasil dihapus!');
            } else {
                setIsDeleteModalOpen(false);
                setActivityToDelete(null);
                showToast(getApiErrorMessage(json, 'Gagal menghapus data.'), 'error');
            }
        } catch (error) {
            setIsDeleteModalOpen(false);
            setActivityToDelete(null);
            showToast('Gagal menghapus data.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({
            code: '',
            name: '',
            is_active: true,
            preset: 'running',
            input_fields: buildFieldsFromKeys(ACTIVITY_PRESETS.running.input_fields),
            output_metrics: buildMetricsFromKeys(ACTIVITY_PRESETS.running.output_metrics),
        });
        setSelectedId(null);
    };

    const filteredActivities = activities.filter(activity =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const { sortedItems: sortedActivities, sortKey, sortDir, requestSort } = useTableSort(filteredActivities);

    return (
        <div className="space-y-6 relative">
            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(''); setToastType('success'); }} />

            <PageHeader
                title="Tipe Aktifitas"
                subtitle="Halaman pengaturan tipe aktifitas"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SearchBar
                    label="Cari Aktifitas"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari aktifitas"
                    className="w-full sm:max-w-xs"
                />
                <Button icon={Plus} onClick={() => { setModalMode('add'); setIsModalOpen(true); }}>
                    Tambah Aktifitas
                </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FC] border-b border-gray-100">
                            <tr>
                                <SortableTh label="No" sortable={false} align="center" className="font-bold text-gray-600 text-xs w-16" />
                                <SortableTh label="Kode Aktifitas" sortKey="code" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="font-bold text-gray-600 text-xs w-32" />
                                <SortableTh label="Nama Aktifitas" sortKey="name" activeKey={sortKey} direction={sortDir} onSort={requestSort} className="font-bold text-gray-600 text-xs" />
                                <SortableTh label="Status" sortKey="is_active" activeKey={sortKey} direction={sortDir} onSort={requestSort} align="center" className="font-bold text-gray-600 text-xs w-32" />
                                <SortableTh label="Actions" sortable={false} align="center" className="font-bold text-gray-600 text-xs w-32" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500 font-medium">Memuat data...</td></tr>
                            ) : (
                                sortedActivities.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800 text-center">{index + 1}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900 text-center">{item.code}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{item.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {item.is_active ? 'AKTIF' : 'NONAKTIF'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-center space-x-2">
                                            <button onClick={() => {
                                                setModalMode('edit');
                                                setSelectedId(item.id);
                                                setFormData({
                                                    code: item.code,
                                                    name: item.name,
                                                    is_active: item.is_active,
                                                    preset: 'custom',
                                                    input_fields: item.input_fields?.length ? item.input_fields : buildFieldsFromKeys(ACTIVITY_PRESETS.running.input_fields),
                                                    output_metrics: item.output_metrics ?? [],
                                                });
                                                setIsModalOpen(true);
                                            }} className="p-1.5 bg-orange-50 text-orange-500 rounded-md hover:bg-orange-100 transition-colors"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => { setActivityToDelete(item); setIsDeleteModalOpen(true); }} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                title={modalMode === 'add' ? 'Tambah Aktifitas' : 'Edit Aktifitas'}
                icon={Activity}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" className="flex-1" onClick={closeModal} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" form="activity-form" variant="primary" className="flex-1" loading={isSubmitting}>
                            Simpan
                        </Button>
                    </>
                }
            >
                <form id="activity-form" onSubmit={handleSubmit} className="admin-form space-y-4">
                    <FormField label="Kode Aktifitas" required>
                        <Input
                            type="text"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        />
                    </FormField>

                    <FormField label="Nama Aktifitas" required>
                        <Input
                            icon={Activity}
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </FormField>

                    <FormField label="Preset Aktivitas">
                        <Select value={formData.preset} onChange={(e) => applyPreset(e.target.value)}>
                            {Object.entries(ACTIVITY_PRESETS).map(([key, preset]) => (
                                <option key={key} value={key}>{preset.label}</option>
                            ))}
                        </Select>
                    </FormField>

                    <FormField label="Field Input">
                        <div className="grid grid-cols-2 gap-2">
                            {FIELD_OPTIONS.map((field) => {
                                const checked = formData.input_fields.some((item) => item.key === field.key);
                                return (
                                    <CheckboxCard
                                        key={field.key}
                                        checked={checked}
                                        onChange={() => toggleInputField(field.key)}
                                        label={field.label}
                                        description={field.unit ? `Unit: ${field.unit}` : undefined}
                                    />
                                );
                            })}
                        </div>
                    </FormField>

                    <FormField label="Metrik Output">
                        <div className="grid grid-cols-2 gap-2">
                            {OUTPUT_OPTIONS.map((metric) => {
                                const checked = formData.output_metrics.some((item) => item.key === metric.key);
                                return (
                                    <CheckboxCard
                                        key={metric.key}
                                        checked={checked}
                                        onChange={() => toggleOutputMetric(metric.key)}
                                        label={metric.label}
                                        description={metric.unit ? `Unit: ${metric.unit}` : undefined}
                                    />
                                );
                            })}
                        </div>
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
                open={isDeleteModalOpen && !!activityToDelete}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDelete}
                title="Hapus Aktifitas?"
                description={`Anda akan menghapus tipe aktivitas "${activityToDelete?.name}". Submission lama tetap ada dengan nama aktivitas tersimpan. Pengguna tidak akan bisa memilih tipe ini lagi saat melakukan submission.`}
                confirmLabel="Ya, Hapus"
                loading={isSubmitting}
            />
        </div>
    );
}
