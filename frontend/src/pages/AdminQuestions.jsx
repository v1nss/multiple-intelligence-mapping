import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ question_text: '', domain_id: '', version_id: '', order_index: '' });

  const fetchAll = async () => {
    try {
      const [qRes, dRes, vRes] = await Promise.all([
        api.get('/admin/questions'),
        api.get('/admin/domains'),
        api.get('/admin/versions'),
      ]);
      setQuestions(qRes.data.questions || []);
      setDomains(dRes.data.domains || []);
      setVersions(vRes.data.versions || []);
    } catch (err) { setError(err.response?.data?.error || 'Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setForm({ question_text: '', domain_id: '', version_id: '', order_index: '' }); setCreating(false); setEditing(null); };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/questions', { ...form, domain_id: parseInt(form.domain_id), version_id: parseInt(form.version_id), order_index: parseInt(form.order_index) });
      resetForm();
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create question'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/questions/${editing}`, { question_text: form.question_text, domain_id: parseInt(form.domain_id), order_index: parseInt(form.order_index) });
      resetForm();
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed to update question'); }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.delete(`/admin/questions/${id}`);
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed to deactivate question'); }
  };

  const startEdit = (q) => {
    setEditing(q.id);
    setCreating(false);
    setForm({ question_text: q.question_text, domain_id: q.domain_id?.toString() || '', version_id: q.version_id?.toString() || '', order_index: q.order_index?.toString() || '' });
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-gray-500">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Management</h1>
          <p className="text-gray-500 mt-1">{questions.length} questions</p>
        </div>
        <button onClick={() => { setCreating(!creating); setEditing(null); setForm({ question_text: '', domain_id: domains[0]?.id?.toString() || '', version_id: versions[0]?.id?.toString() || '', order_index: '' }); }}
          className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition text-sm">
          + New Question
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">{error}</div>}

      {/* Create / Edit Form */}
      {(creating || editing) && (
        <form onSubmit={editing ? handleUpdate : handleCreate} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8 space-y-4">
          <h3 className="font-semibold text-gray-900">{editing ? 'Edit Question' : 'New Question'}</h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Question Text</label>
            <textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" rows={3} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Domain</label>
              <select value={form.domain_id} onChange={(e) => setForm({ ...form, domain_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white" required>
                <option value="">Select</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.name} ({d.type})</option>)}
              </select>
            </div>
            {!editing && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Version</label>
                <select value={form.version_id} onChange={(e) => setForm({ ...form, version_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white" required>
                  <option value="">Select</option>
                  {versions.map(v => <option key={v.id} value={v.id}>{v.version_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Order Index</label>
              <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 text-sm">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={resetForm} className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Questions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">#</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Question</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Domain</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Active</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!q.is_active ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4 text-gray-400">{q.order_index}</td>
                  <td className="py-3 px-4 max-w-xs truncate">{q.question_text}</td>
                  <td className="py-3 px-4">{q.domain_name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${q.domain_type === 'MI' ? 'bg-indigo-50 text-indigo-700' : 'bg-cyan-50 text-cyan-700'}`}>{q.domain_type}</span>
                  </td>
                  <td className="py-3 px-4">{q.is_active ? '✅' : '❌'}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <button onClick={() => startEdit(q)} className="px-3 py-1 text-xs font-medium text-indigo-600 border border-gray-200 rounded-lg hover:bg-indigo-50">Edit</button>
                    {q.is_active && (
                      <button onClick={() => handleDeactivate(q.id)} className="px-3 py-1 text-xs font-medium text-red-600 border border-gray-200 rounded-lg hover:bg-red-50">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
