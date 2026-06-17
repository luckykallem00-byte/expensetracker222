import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const { user, signIn, loading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  async function handleSignIn() {
    try {
      await signIn();
      navigate('/dashboard', { replace: true });
    } catch (_) {
      // error managed in context
    }
  }

  return (
    <div className="page-shell">
      <div className="auth-card">
        <h1>FinancePro</h1>
        <p>Sign in with Google to access your secure expense dashboard.</p>
        <button className="primary-button" onClick={handleSignIn} disabled={loading}>
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>
        {error && <div className="error-box">{error}</div>}
        <p className="auth-note">
          New here? <a href="/register">Register with Google</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
