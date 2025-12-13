/**
 * Settings Tab - Remote Config Management
 */
import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertTriangle, Power } from 'lucide-react';
import { getRemoteConfig, updateRemoteConfig, RemoteConfig } from '../adminService';

const SettingsTab: React.FC = () => {
  const [config, setConfig] = useState<RemoteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const data = await getRemoteConfig();
    setConfig(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const success = await updateRemoteConfig(config);
    setSaving(false);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const updateFeature = (feature: keyof RemoteConfig['features'], value: boolean) => {
    if (!config) return;
    setConfig({
      ...config,
      features: { ...config.features, [feature]: value },
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (!config) {
    return <div className="text-center py-8 text-red-400">Failed to load config</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <div className="flex gap-2">
          <button
            onClick={loadConfig}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              saved 
                ? 'bg-emerald-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save size={18} />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* App Status */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Power size={20} />
            App Status
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">App Enabled</p>
                <p className="text-sm text-gray-500">Enable/disable the web app globally</p>
              </div>
              <ToggleSwitch
                checked={config.app_enabled}
                onChange={(v) => setConfig({ ...config, app_enabled: v })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-yellow-400 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Maintenance Mode
                </p>
                <p className="text-sm text-gray-500">Show maintenance message to users</p>
              </div>
              <ToggleSwitch
                checked={config.maintenance_mode}
                onChange={(v) => setConfig({ ...config, maintenance_mode: v })}
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Features</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Delete</p>
                <p className="text-sm text-gray-500">Allow auto-delete spam messages</p>
              </div>
              <ToggleSwitch
                checked={config.features.auto_delete}
                onChange={(v) => updateFeature('auto_delete', v)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Ban</p>
                <p className="text-sm text-gray-500">Allow auto-ban spammers</p>
              </div>
              <ToggleSwitch
                checked={config.features.auto_ban}
                onChange={(v) => updateFeature('auto_ban', v)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cloud Patterns</p>
                <p className="text-sm text-gray-500">Use cloud spam patterns</p>
              </div>
              <ToggleSwitch
                checked={config.features.cloud_patterns}
                onChange={(v) => updateFeature('cloud_patterns', v)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">License Required</p>
                <p className="text-sm text-gray-500">Require license to use app</p>
              </div>
              <ToggleSwitch
                checked={config.features.license_required}
                onChange={(v) => updateFeature('license_required', v)}
              />
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Version Control</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Minimum Version</label>
              <input
                type="text"
                value={config.min_version}
                onChange={(e) => setConfig({ ...config, min_version: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                placeholder="1.0.0"
              />
              <p className="text-xs text-gray-500 mt-1">Users with older versions will be prompted to update</p>
            </div>
          </div>
        </div>

        {/* Announcement */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Global Announcement</h3>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Announcement Message</label>
            <textarea
              value={config.announcement}
              onChange={(e) => setConfig({ ...config, announcement: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white h-24"
              placeholder="Leave empty to hide announcement"
            />
            <p className="text-xs text-gray-500 mt-1">This will be shown to all users</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toggle Switch Component
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-12 h-6 rounded-full transition-colors ${
      checked ? 'bg-emerald-600' : 'bg-gray-600'
    }`}
  >
    <div
      className={`w-5 h-5 bg-white rounded-full transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-0.5'
      }`}
    />
  </button>
);

export default SettingsTab;
