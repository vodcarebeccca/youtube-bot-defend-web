/**
 * OAuth Callback Page
 * Handles the redirect from Google OAuth
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { youtubeOAuth } from '../services/youtubeOAuth';

const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(error === 'access_denied' ? 'Login cancelled' : error);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Invalid callback parameters');
        return;
      }

      try {
        const success = await youtubeOAuth.handleCallback(code, state);
        
        if (success) {
          setStatus('success');
          
          // Close popup if opened as popup, otherwise redirect
          if (window.opener) {
            window.opener.postMessage({ type: 'oauth_success' }, window.location.origin);
            setTimeout(() => window.close(), 1500);
          } else {
            setTimeout(() => navigate('/video-comments'), 1500);
          }
        } else {
          setStatus('error');
          setErrorMessage('Failed to complete login');
        }
      } catch (e: any) {
        setStatus('error');
        setErrorMessage(e.message || 'Login failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="bg-[#1a1a2e] rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {status === 'processing' && (
          <>
            <div className="text-5xl mb-4 animate-pulse">🔄</div>
            <h1 className="text-xl font-bold text-white mb-2">Processing Login...</h1>
            <p className="text-gray-400">Please wait while we complete your login.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-emerald-400 mb-2">Login Successful!</h1>
            <p className="text-gray-400">
              {window.opener 
                ? 'You can close this window now.' 
                : 'Redirecting to Video Comments...'}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-red-400 mb-2">Login Failed</h1>
            <p className="text-gray-400 mb-4">{errorMessage}</p>
            <button
              onClick={() => window.opener ? window.close() : navigate('/video-comments')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {window.opener ? 'Close Window' : 'Go Back'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
