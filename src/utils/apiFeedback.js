/** True only when API body explicitly signals success. */
export function isApiSuccess(json) {
  return json?.success === true || json?.status === 'success';
}

export function getApiErrorMessage(json, fallback = 'Terjadi kesalahan.') {
  return json?.error?.message || json?.message || fallback;
}
