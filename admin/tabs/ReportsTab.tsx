/**
 * Reports Tab - View spam reports and feedback from users
 */
import React, { useState, useEffect } from 'react';
import { AlertTriangle, MessageSquare, Check, X, RefreshCw, Bug, Lightbulb, HelpCircle, Mail } from 'lucide-react';

// Firebase Config
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDtDlYCdA07dTwU3paVJHo21PMt-cCU55I',
  projectId: 'yt-bot-defend',
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

interface SpamReport {
  _id: string;
  report_type: 'false_positive' | 'false_negative';
  message_content: string;
  detected_as: string;
  reported_by: string;
  channel_id: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_note?: string;
  created_at: string;
}

interface Feedback {
  _id: string;
  type: 'bug' | 'feature' | 'general';
  message: string;
  email: string;
  source: string;
  status: 'pending' | 'reviewed' | 'resolved';
  user_agent: string;
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

const ReportsTab: React.FC = () => {
  const [reports, setReports] = useState<SpamReport[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'feedback'>('reports');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadReports(), loadFeedback()]);
    setLoading(false);
  };

  const loadReports = async () => {
    try {
      const url = `${BASE_URL}/webapp_reports?key=${FIREBASE_CONFIG.apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const items = (data.documents || []).map(firestoreToDict) as SpamReport[];
        setReports(items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (e) {
      console.error('Load reports error:', e);
    }
  };

  const loadFeedback = async () => {
    try {
      const url = `${BASE_URL}/webapp_feedback?key=${FIREBASE_CONFIG.apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const items = (data.documents || []).map(firestoreToDict) as Feedback[];
        setFeedback(items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (e) {
      console.error('Load feedback error:', e);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const url = `${BASE_URL}/webapp_reports/${reportId}?key=${FIREBASE_CONFIG.apiKey}`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: { status: { stringValue: status } },
        }),
      });
      await loadReports();
    } catch (e) {
      console.error('Update report error:', e);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, status: string) => {
    try {
      const url = `${BASE_URL}/webapp_feedback/${feedbackId}?key=${FIREBASE_CONFIG.apiKey}`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: { status: { stringValue: status } },
        }),
      });
      await loadFeedback();
    } catch (e) {
      console.error('Update feedback error:', e);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug size={16} className="text-red-400" />;
      case 'feature': return <Lightbulb size={16} className="text-yellow-400" />;
      default: return <HelpCircle size={16} className="text-blue-400" />;
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const pendingFeedback = feedback.filter(f => f.status === 'pending').length;

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Reports & Feedback</h2>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'reports' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <AlertTriangle size={18} />
          Spam Reports
          {pendingReports > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-500 rounded-full">{pendingReports}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'feedback' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <MessageSquare size={18} />
          User Feedback
          {pendingFeedback > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-500 rounded-full">{pendingFeedback}</span>
          )}
        </button>
      </div>

      {/* Spam Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
              <AlertTriangle size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Belum ada spam report dari user</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report._id}
                className={`bg-gray-800 rounded-xl p-4 border ${
                  report.status === 'pending' ? 'border-yellow-600' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        report.report_type === 'false_positive' 
                          ? 'bg-blue-900/50 text-blue-400' 
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {report.report_type === 'false_positive' ? 'False Positive' : 'False Negative'}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        report.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                        report.status === 'reviewed' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-green-900/50 text-green-400'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(report.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-300 bg-gray-700/50 p-2 rounded mb-2 break-all">
                      "{report.message_content}"
                    </p>
                    <p className="text-xs text-gray-500">
                      Detected as: <span className="text-gray-400">{report.detected_as || 'N/A'}</span>
                    </p>
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateReportStatus(report._id, 'reviewed')}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                        title="Mark as Reviewed"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => updateReportStatus(report._id, 'resolved')}
                        className="p-2 bg-green-600 hover:bg-green-700 rounded-lg"
                        title="Mark as Resolved"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Feedback */}
      {activeTab === 'feedback' && (
        <div className="space-y-3">
          {feedback.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Belum ada feedback dari user</p>
            </div>
          ) : (
            feedback.map((fb) => (
              <div
                key={fb._id}
                className={`bg-gray-800 rounded-xl p-4 border ${
                  fb.status === 'pending' ? 'border-yellow-600' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(fb.type)}
                      <span className="text-sm font-medium text-gray-300 capitalize">{fb.type}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        fb.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                        fb.status === 'reviewed' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-green-900/50 text-green-400'
                      }`}>
                        {fb.status}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(fb.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-300 bg-gray-700/50 p-3 rounded mb-2">
                      {fb.message}
                    </p>
                    {fb.email && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail size={12} />
                        {fb.email}
                      </p>
                    )}
                  </div>
                  {fb.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateFeedbackStatus(fb._id, 'reviewed')}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                        title="Mark as Reviewed"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => updateFeedbackStatus(fb._id, 'resolved')}
                        className="p-2 bg-green-600 hover:bg-green-700 rounded-lg"
                        title="Mark as Resolved"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
