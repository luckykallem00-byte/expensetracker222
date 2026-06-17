import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Register() {
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  async function handleRegister() {
    try {
      await signIn();
      navigate('/dashboard', { replace: true });
    } catch (_) {
      // no-op
    }
  }

  return (
    <div className="page-shell">
      <div className="auth-card">
        <h1>Register for FinancePro</h1>
        <p>Creating access is easy: sign in with Google and start tracking expenses.</p>
        <button className="primary-button" onClick={handleRegister} disabled={loading}>
          {loading ? 'Opening Google…' : 'Register with Google'}
        </button>
        <p className="auth-note">
          Already registered? <a href="/login">Sign in instead</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
