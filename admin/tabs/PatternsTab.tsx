/**
 * Spam Patterns Management Tab
 */
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Search } from 'lucide-react';
import { getSpamPatterns, addSpamPattern, deleteSpamPattern, SpamPattern } from '../adminService';

const PatternsTab: React.FC = () => {
  const [patterns, setPatterns] = useState<SpamPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [newPattern, setNewPattern] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [isRegex, setIsRegex] = useState(false);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    setLoading(true);
    const data = await getSpamPatterns();
    setPatterns(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newPattern.trim()) return;
    
    const success = await addSpamPattern({
      pattern: newPattern.trim(),
      description: newDescription.trim(),
      severity: newSeverity,
      is_regex: isRegex,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    if (success) {
      setNewPattern('');
      setNewDescription('');
      setNewSeverity('medium');
      setIsRegex(false);
      setShowAddForm(false);
      loadPatterns();
    }
  };

  const handleDelete = async (patternId: string) => {
    if (!confirm('Hapus pattern ini?')) return;
    const success = await deleteSpamPattern(patternId);
    if (success) loadPatterns();
  };

  const filteredPatterns = patterns.filter(p => 
    p.pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const severityColors = {
    low: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
    medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
    high: 'bg-red-900/30 text-red-400 border-red-900/50',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Spam Patterns</h2>
        <div className="flex gap-2">
          <button
            onClick={loadPatterns}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
          >
            <Plus size={18} />
            Add Pattern
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Pattern</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pattern</label>
              <input
                type="text"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                placeholder="e.g., judol, slot, gacor"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Severity</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRegex"
                checked={isRegex}
                onChange={(e) => setIsRegex(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isRegex" className="text-sm text-gray-400">Is Regex Pattern</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Add Pattern
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

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
          placeholder="Search patterns..."
        />
      </div>

      {/* Patterns List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : filteredPatterns.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No patterns found</div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Pattern</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Description</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Severity</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Type</th>
                <th className="text-right px-4 py-3 text-sm text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatterns.map((pattern) => (
                <tr key={pattern._id} className="border-t border-gray-700 hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-mono text-sm">{pattern.pattern}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{pattern.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs border ${severityColors[pattern.severity]}`}>
                      {pattern.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {pattern.is_regex ? 'Regex' : 'Keyword'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(pattern._id!)}
                      className="p-1 text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-4">
        Total: {filteredPatterns.length} patterns
      </p>
    </div>
  );
};

export default PatternsTab;
