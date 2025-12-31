import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nContext';

export default function Login() {
  const [email, setEmail] = useState('admin@rehab.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, language, switchLanguage } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.error || t('auth.loginFailed');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    switchLanguage(newLang);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Language Switcher */}
        <div className="flex justify-end">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <Globe className="w-4 h-4" />
            {language === 'vi' ? 'Tiếng Việt' : 'English'}
          </button>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">{t('auth.rehabAdmin')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('auth.adminPortal')}</p>
          <p className="mt-1 text-xs text-gray-500">{t('auth.patientMobileOnly')}</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="space-y-4 rounded-lg bg-white px-6 py-8 shadow">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {loading ? t('auth.signingIn') : t('auth.login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
