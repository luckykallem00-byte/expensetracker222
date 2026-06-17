function ExpenseList({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return <div className="empty-box">No expenses found for the selected filters.</div>;
  }

  return (
    <div className="expense-list">
      <h2>Recent Expenses</h2>
      {expenses.map((expense) => (
        <div key={expense.id} className="expense-card">
          <div>
            <div className="expense-description">{expense.note || expense.category}</div>
            <div className="expense-meta">{expense.category} · {new Date(expense.date).toLocaleDateString()}</div>
          </div>
          <div className="expense-actions">
            <span className="expense-amount">₹ {Number(expense.amount).toLocaleString()}</span>
            <button className="link-button" onClick={() => onEdit(expense)}>Edit</button>
            <button className="link-button danger" onClick={() => onDelete(expense.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ExpenseList;
