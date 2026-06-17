import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import SummaryCards from '../components/SummaryCards';
import ExpenseList from '../components/ExpenseList';
import ExpenseFormModal from '../components/ExpenseFormModal';
import CategoryChart from '../components/CategoryChart';

const initialFilters = { category: '', startDate: '', endDate: '' };

function Dashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const [categoriesResponse, summaryResponse] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/summary'),
        ]);
        setCategories(categoriesResponse.data.data);
        setSummary(summaryResponse.data);
        await loadExpenses(filters);
      } catch (loadError) {
        setError(loadError?.response?.data?.error || loadError.message || 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadExpenses(filters).catch((loadError) => {
      setError(loadError?.response?.data?.error || loadError.message || 'Unable to load expenses');
    });
  }, [filters, user]);

  async function loadExpenses(filterValues) {
    setError(null);
    const params = {};
    if (filterValues.category) params.category = filterValues.category;
    if (filterValues.startDate) params.startDate = filterValues.startDate;
    if (filterValues.endDate) params.endDate = filterValues.endDate;
    const response = await api.get('/api/expenses', { params });
    setExpenses(response.data.data);
  }

  async function handleDeleteExpense(expenseId) {
    setError(null);
    try {
      await api.delete(`/api/expenses/${expenseId}`);
      setExpenses((current) => current.filter((expense) => expense.id !== expenseId));
    } catch (deleteError) {
      setError(deleteError?.response?.data?.error || deleteError.message || 'Unable to delete expense');
    }
  }

  async function handleSaveExpense(expensePayload) {
    setError(null);
    try {
      if (selectedExpense) {
        const response = await api.put(`/api/expenses/${selectedExpense.id}`, expensePayload);
        setExpenses((current) => current.map((expense) => (expense.id === selectedExpense.id ? response.data : expense)));
      } else {
        const response = await api.post('/api/expenses', expensePayload);
        setExpenses((current) => [response.data, ...current]);
      }
      setModalOpen(false);
      setSelectedExpense(null);
      const summaryResponse = await api.get('/api/summary');
      setSummary(summaryResponse.data);
    } catch (saveError) {
      setError(saveError?.response?.data?.error || saveError.message || 'Unable to save expense');
      throw saveError;
    }
  }

  const categoryOptions = useMemo(() => [{ id: '', name: 'All categories' }, ...categories], [categories]);

  if (loading) {
    return <div className="page-shell">Loading dashboard…</div>;
  }

  return (
    <div className="page-shell">
      <header className="dashboard-header">
        <div>
          <h1>FinancePro Dashboard</h1>
          <p>Welcome, {user?.displayName || user?.email || 'User'}.</p>
        </div>
        <div>
          <button className="secondary-button" onClick={() => navigate('/login')}>
            Switch Account
          </button>
          <button className="secondary-button danger" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      {error && <div className="error-box">{error}</div>}

      <SummaryCards summary={summary} />

      <section className="dashboard-toolbar">
        <div className="filter-group">
          <label>
            Category
            <select value={filters.category} onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.name || ''}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Start date
            <input type="date" value={filters.startDate} onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))} />
          </label>
          <label>
            End date
            <input type="date" value={filters.endDate} onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))} />
          </label>
        </div>
        <button className="primary-button" onClick={() => setModalOpen(true)}>
          Add Expense
        </button>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <ExpenseList expenses={expenses} onEdit={(expense) => { setSelectedExpense(expense); setModalOpen(true); }} onDelete={handleDeleteExpense} />
        </div>
        <div className="dashboard-panel">
          <CategoryChart data={summary?.byCategory || []} />
        </div>
      </div>

      <ExpenseFormModal
        visible={modalOpen}
        expense={selectedExpense}
        categories={categories}
        onClose={() => {
          setModalOpen(false);
          setSelectedExpense(null);
        }}
        onSave={handleSaveExpense}
      />
    </div>
  );
}

export default Dashboard;
