function SummaryCards({ summary }) {
  return (
    <section className="summary-grid">
      <div className="summary-card">
        <div className="summary-label">Total Income</div>
        <div className="summary-value">₹ {summary?.totalIncome?.toLocaleString() ?? '0'}</div>
      </div>
      <div className="summary-card">
        <div className="summary-label">Total Expense</div>
        <div className="summary-value">₹ {summary?.totalExpense?.toLocaleString() ?? '0'}</div>
      </div>
      <div className="summary-card">
        <div className="summary-label">Balance</div>
        <div className="summary-value">₹ {summary?.balance?.toLocaleString() ?? '0'}</div>
      </div>
      <div className="summary-card">
        <div className="summary-label">Categories</div>
        <div className="summary-value">{summary?.byCategory?.length ?? 0}</div>
      </div>
    </section>
  );
}

export default SummaryCards;
