/**
 * Blacklist Tab - Manage global blacklist users
 */
import React, { useState, useEffect } from 'react';
import { Ban, Plus, Trash2, RefreshCw, Search, CheckCircle, XCircle } from 'lucide-react';

// Firebase Config
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDtDlYCdA07dTwU3paVJHo21PMt-cCU55I',
  projectId: 'yt-bot-defend',
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

interface BlacklistEntry {
  _id: string;
  user_id: string;
  username: string;
  reason: string;
  is_verified: boolean;
  created_at: string;
}

function firestoreToDict(doc: any): Record<string, any> {
  const fields = doc.fields || {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields) as [string, any][]) {
    if ('stringValue' in value) result[key] = value.stringValue;
    else if ('integerValue' in value) result[key] = parseInt(value.integerValue);
    else if ('booleanValue' in value) result[key] = value.booleanValue;
  }
  if (doc.name) result._id = doc.name.split('/').pop();
  return result;
}

function dictToFirestore(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_')) continue;
    if (typeof value === 'string') fields[key] = { stringValue: value };
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
    else if (typeof value === 'number') fields[key] = { integerValue: String(value) };
  }
  return fields;
}

const BlacklistTab: React.FC = () => {
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [newUserId, setNewUserId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newVerified, setNewVerified] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/webapp_blacklist?key=${FIREBASE_CONFIG.apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const items = (data.documents || []).map(firestoreToDict) as BlacklistEntry[];
        setBlacklist(items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (e) {
      console.error('Load blacklist error:', e);
    }
    setLoading(false);
  };

  const addToBlacklist = async () => {
    if (!newUserId.trim() || !newUsername.trim()) return;
    
    setAdding(true);
    try {
      const entryId = `bl_${Date.now()}`;
      const url = `${BASE_URL}/webapp_blacklist/${entryId}?key=${FIREBASE_CONFIG.apiKey}`;
      
      const data = {
        user_id: newUserId.trim(),
        username: newUsername.trim(),
        reason: newReason.trim() || 'Manual blacklist',
        is_verified: newVerified,
        created_at: new Date().toISOString(),
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: dictToFirestore(data) }),
      });

      if (response.ok) {
        setNewUserId('');
        setNewUsername('');
        setNewReason('');
        setShowAddForm(false);
        await loadBlacklist();
      }
    } catch (e) {
      console.error('Add to blacklist error:', e);
    }
    setAdding(false);
  };

  const removeFromBlacklist = async (entryId: string) => {
    if (!confirm('Hapus user dari blacklist?')) return;
    
    try {
      const url = `${BASE_URL}/webapp_blacklist/${entryId}?key=${FIREBASE_CONFIG.apiKey}`;
      await fetch(url, { method: 'DELETE' });
      await loadBlacklist();
    } catch (e) {
      console.error('Remove from blacklist error:', e);
    }
  };

  const toggleVerified = async (entry: BlacklistEntry) => {
    try {
      const url = `${BASE_URL}/webapp_blacklist/${entry._id}?key=${FIREBASE_CONFIG.apiKey}`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: { is_verified: { booleanValue: !entry.is_verified } },
        }),
      });
      await loadBlacklist();
    } catch (e) {
      console.error('Toggle verified error:', e);
    }
  };

  const filteredBlacklist = blacklist.filter(entry =>
    entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Global Blacklist</h2>
          <p className="text-gray-400 text-sm">User yang di-blacklist akan otomatis terdeteksi sebagai spam</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
          >
            <Plus size={16} /> Tambah User
          </button>
          <button
            onClick={loadBlacklist}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
          <h3 className="font-semibold mb-4">Tambah ke Blacklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Channel ID *</label>
              <input
                type="text"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="UC..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username *</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Nama channel spammer"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-sm"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Alasan</label>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Spam judol, toxic, dll"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newVerified}
                onChange={(e) => setNewVerified(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-300">Verified (aktif untuk semua user)</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm"
              >
                Batal
              </button>
              <button
                onClick={addToBlacklist}
                disabled={!newUserId.trim() || !newUsername.trim() || adding}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm disabled:opacity-50"
              >
                {adding ? 'Menambahkan...' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari username, ID, atau alasan..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-gray-400">
          Total: <span className="text-white font-medium">{blacklist.length}</span>
        </span>
        <span className="text-gray-400">
          Verified: <span className="text-green-400 font-medium">{blacklist.filter(b => b.is_verified).length}</span>
        </span>
        <span className="text-gray-400">
          Unverified: <span className="text-yellow-400 font-medium">{blacklist.filter(b => !b.is_verified).length}</span>
        </span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredBlacklist.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
            <Ban size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">
              {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada user di blacklist'}
            </p>
          </div>
        ) : (
          filteredBlacklist.map((entry) => (
            <div
              key={entry._id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleVerified(entry)}
                  className={`p-1 rounded ${entry.is_verified ? 'text-green-400' : 'text-yellow-400'}`}
                  title={entry.is_verified ? 'Verified - Klik untuk unverify' : 'Unverified - Klik untuk verify'}
                >
                  {entry.is_verified ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </button>
                <div>
                  <p className="font-medium text-white">{entry.username}</p>
                  <p className="text-xs text-gray-500">{entry.user_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-400">{entry.reason}</p>
                  <p className="text-xs text-gray-600">{formatDate(entry.created_at)}</p>
                </div>
                <button
                  onClick={() => removeFromBlacklist(entry._id)}
                  className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg"
                  title="Hapus dari blacklist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-sm text-gray-400">
          <strong className="text-gray-300">Info:</strong> User yang di-blacklist dengan status "Verified" akan otomatis terdeteksi sebagai spam (score 100) di semua channel yang menggunakan web app ini.
        </p>
      </div>
    </div>
  );
};

export default BlacklistTab;
