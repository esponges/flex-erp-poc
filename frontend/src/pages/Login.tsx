import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async () => {
      await login(email, password);
    },
    onSuccess: () => {
      router.navigate({ to: '/inventory' });
    },
    onError: () => {
      setError(t('auth.loginFailed'));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('auth.emailRequired'));
      return;
    }

    setError('');
    loginMutation.mutate();
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            {t('app.title')}
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            {t('auth.signIn')}
          </p>
        </div>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-md p-4'>
              <div className='text-sm text-red-600'>{error}</div>
            </div>
          )}

          <div>
            <label htmlFor='email' className='sr-only'>
              {t('auth.email')}
            </label>
            <input
              id='email'
              name='email'
              type='email'
              autoComplete='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
              placeholder={t('auth.email')}
            />
          </div>

          <div>
            <label htmlFor='password' className='sr-only'>
              {t('auth.password')}
            </label>
            <input
              id='password'
              name='password'
              type='password'
              autoComplete='current-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>

          <div>
            <button
              type='submit'
              disabled={loginMutation.isPending}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
            >
              {loginMutation.isPending ? t('auth.signingIn') : t('auth.signInButton')}
            </button>
          </div>

          <div className='text-xs text-gray-500 text-center'>
            {t('auth.demoNote')}
          </div>
        </form>
      </div>
    </div>
  );
}
