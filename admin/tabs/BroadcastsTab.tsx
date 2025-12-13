/**
 * Broadcasts Management Tab
 */
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Send, Bell } from 'lucide-react';
import { getBroadcasts, sendBroadcast, deleteBroadcast, Broadcast } from '../adminService';

const BroadcastsTab: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const loadBroadcasts = async () => {
    setLoading(true);
    const data = await getBroadcasts();
    setBroadcasts(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    
    const success = await sendBroadcast({
      title: title.trim(),
      message: message.trim(),
      type,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    if (success) {
      setTitle('');
      setMessage('');
      setType('info');
      setShowAddForm(false);
      loadBroadcasts();
    }
  };

  const handleDelete = async (broadcastId: string) => {
    if (!confirm('Hapus broadcast ini?')) return;
    const success = await deleteBroadcast(broadcastId);
    if (success) loadBroadcasts();
  };

  const typeColors = {
    info: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
    warning: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
    error: 'bg-red-900/30 text-red-400 border-red-900/50',
    success: 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Broadcasts</h2>
        <div className="flex gap-2">
          <button
            onClick={loadBroadcasts}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
          >
            <Send size={18} />
            Send Broadcast
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-semibold mb-4">Send New Broadcast</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                placeholder="e.g., Maintenance Notice"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white h-24"
                placeholder="Broadcast message..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
              >
                <option value="info">Info (Blue)</option>
                <option value="warning">Warning (Yellow)</option>
                <option value="error">Error (Red)</option>
                <option value="success">Success (Green)</option>
              </select>
            </div>
            
            {/* Preview */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preview</label>
              <div className={`p-3 rounded-lg border ${typeColors[type]}`}>
                📢 {title || 'Title'}: {message || 'Message'}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2"
            >
              <Send size={16} />
              Send Broadcast
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Broadcasts List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bell className="mx-auto mb-2 opacity-50" size={32} />
          <p>No broadcasts yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {broadcasts.map((broadcast) => (
            <div
              key={broadcast._id}
              className={`p-4 rounded-xl border ${typeColors[broadcast.type]} flex items-start justify-between`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{broadcast.title}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    broadcast.is_active ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {broadcast.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm opacity-80">{broadcast.message}</p>
                <p className="text-xs opacity-50 mt-2">
                  {new Date(broadcast.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(broadcast._id!)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500 mt-4">
        Total: {broadcasts.length} broadcasts
      </p>
    </div>
  );
};

export default BroadcastsTab;
