import { useEffect, useState } from 'react';

const defaultFormState = {
  amount: '',
  category: '',
  date: '',
  note: '',
};

function ExpenseFormModal({ visible, expense, categories, onClose, onSave }) {
  const [formState, setFormState] = useState(defaultFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (expense) {
      setFormState({
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        note: expense.note || '',
      });
    } else {
      setFormState(defaultFormState);
    }
  }, [expense, visible]);

  if (!visible) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSave({
        amount: Number(formState.amount),
        category: formState.category,
        date: formState.date,
        note: formState.note,
      });
      setFormState(defaultFormState);
    } catch (submitError) {
      setError(submitError?.response?.data?.error || submitError.message || 'Unable to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel">
        <div className="modal-header">
          <h3>{expense ? 'Edit Expense' : 'Add Expense'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Amount
            <input name="amount" value={formState.amount} onChange={handleChange} type="number" step="0.01" required />
          </label>
          <label>
            Category
            <select name="category" value={formState.category} onChange={handleChange} required>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input name="date" value={formState.date} onChange={handleChange} type="date" required />
          </label>
          <label>
            Note
            <input name="note" value={formState.note} onChange={handleChange} type="text" placeholder="Optional note" />
          </label>
          {error && <div className="error-box">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Saving…' : expense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseFormModal;
