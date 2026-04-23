import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function formatBirthdate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function AccountSettings() {
  const { user, profileImage, updateProfileImage, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);

  const initialForm = useMemo(
    () => ({
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      phoneNumber: user?.phone || '',
      dateOfBirth: formatBirthdate(user?.birthdate),
      gender: user?.gender || 'Male',
      completeAddress: user?.address || '',
    }),
    [user]
  );

  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });
    setSaving(true);

    try {
      await updateUser({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phoneNumber,
        birthdate: form.dateOfBirth || null,
        gender: form.gender || null,
        address: form.completeAddress,
      });
      setStatus({ type: 'success', message: 'Your profile has been updated.' });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err?.response?.data?.error || 'Failed to save changes. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateProfileImage(reader.result);
      }
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}` || 'U';
  const fullName = `${user?.first_name || 'User'} ${user?.last_name || ''}`.trim();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-100/80 px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Account Settings</h1>
          <p className="mt-2 text-base text-gray-500">
            Manage your personal information and account preferences.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Upload profile photo"
              />
              <div className="relative mx-auto h-56 w-56">
                <div className="h-full w-full overflow-hidden rounded-full border-8 border-slate-500 bg-linear-to-br from-blue-500 to-indigo-600 text-5xl font-semibold text-white shadow">
                  {profileImage ? (
                    <img src={profileImage} alt="User profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">{initials}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-2 right-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
                  aria-label="Upload profile photo"
                  title="Upload profile photo"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7"
                  >
                    <path d="M14.5 4h-5L7.2 6.3H4a2 2 0 0 0-2 2v8.7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.3a2 2 0 0 0-2-2h-3.2L14.5 4Z" />
                    <circle cx="12" cy="12.5" r="3.5" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">{fullName}</h2>
                <p className="mt-1 text-sm text-gray-500">{user?.email || 'No email'}</p>
                <span className="mt-3 inline-flex items-center rounded-full bg-blue-100 px-4 py-1 text-xs font-semibold text-blue-700">
                  {user?.role === 'admin' ? 'Admin' : 'Student'}
                </span>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-500 hover:bg-rose-50"
              >
                <span>Sign Out</span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4.75A1.75 1.75 0 0 1 4.75 3h5.5a.75.75 0 0 1 0 1.5h-5.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h5.5a.75.75 0 0 1 0 1.5h-5.5A1.75 1.75 0 0 1 3 15.25V4.75Zm8.22 2.47a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06L12.19 10H7.75a.75.75 0 0 1 0-1.5h4.44l-.97-.97a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </section>
          </aside>

          <section className="self-start rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Personal Information</h2>
                  <p className="mt-1 text-sm text-gray-500">Update your personal details here.</p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {status.message && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    status.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {status.message}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-500">First Name</span>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-500">Last Name</span>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-500">Email Address</span>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-500">Phone Number</span>
                  <input
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-500">Date of Birth</span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-500">Gender</span>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-gray-500">Complete Address</span>
                <input
                  name="completeAddress"
                  value={form.completeAddress}
                  onChange={handleChange}
                  className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
