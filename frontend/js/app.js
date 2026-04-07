import { getAuthUser, initFirebase, logout } from '/js/auth.js';
import { getDatabase, ref, push, onValue, remove } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

let currentUser = null;
let totalIncome = 0;
let expenses = [];
let transactions = [];
let budgets = {
  'Food & Dining': 5000,
  'Rent': 15000,
  'Utilities': 3000,
  'Transport': 1000,
  'Entertainment': 2000,
  'Shopping': 2000,
  'Healthcare': 1000,
  'Education': 2000,
  'Other': 1000,
};
let reminders = [];
let alerts = [];
let currentExpenseAction = 'add';
let currentIncomeAction = 'add';

function getStorageKey() {
  return `financepro_user_${currentUser.uid}`;
}

function loadLocalData() {
  const saved = localStorage.getItem(getStorageKey());
  if (!saved) return;
  const parsed = JSON.parse(saved);
  totalIncome = parsed.totalIncome || totalIncome;
  budgets = parsed.budgets || budgets;
  reminders = parsed.reminders || [];
  alerts = parsed.alerts || [];
  transactions = parsed.transactions || [];
}

function saveLocalData() {
  localStorage.setItem(getStorageKey(), JSON.stringify({ totalIncome, budgets, reminders, alerts, transactions }));
}

function addAlert(type, title, message) {
  alerts.unshift({ id: Date.now(), type, title, message, date: new Date().toISOString() });
  if (alerts.length > 10) alerts = alerts.slice(0, 10);
  saveLocalData();
  updateAlertsList();
}

function addToHistory(type, description, category, amount) {
  const entry = {
    id: Date.now(),
    type,
    description,
    category,
    amount: type === 'income' ? amount : -amount,
    date: new Date().toISOString().split('T')[0],
  };
  transactions.unshift(entry);
  if (transactions.length > 50) transactions = transactions.slice(0, 50);
  saveLocalData();
}

function updateUserHeader() {
  const nameDisplay = document.getElementById('user-name-display');
  if (nameDisplay) {
    nameDisplay.textContent = currentUser.name || currentUser.email || 'User';
  }
}

async function loadExpenses() {
  try {
    await initFirebase();
    const database = getDatabase();
    const expensesRef = ref(database, 'users/' + currentUser.uid + '/expenses');
    onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      expenses = data ? Object.entries(data).map(([id, expense]) => ({ id, ...expense })) : [];
      expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
      updateDashboard();
    });
  } catch (error) {
    console.error(error);
  }
}

async function submitExpense(event) {
  event.preventDefault();

  if (currentExpenseAction !== 'add') {
    alert('Only adding new expenses is supported in this version.');
    return;
  }

  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const description = document.getElementById('expense-desc').value.trim();
  const date = document.getElementById('expense-date').value;

  if (Number.isNaN(amount) || amount <= 0) {
    alert('Please enter a valid expense amount.');
    return;
  }

  if (!date) {
    alert('Please select a date.');
    return;
  }

  try {
    const database = getDatabase();
    const expensesRef = ref(database, 'users/' + currentUser.uid + '/expenses');
    await push(expensesRef, { amount, category, date, note: description });
    addToHistory('expense', description || category, category, amount);
    addAlert('success', 'Expense added', `Saved ? ${amount.toLocaleString('en-IN')} to ${category}`);
    closeExpenseModal();
    document.getElementById('expense-form').reset();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;

  try {
    const database = getDatabase();
    const expenseRef = ref(database, 'users/' + currentUser.uid + '/expenses/' + id);
    await remove(expenseRef);
    expenses = expenses.filter((expense) => expense.id !== id);
    updateDashboard();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

function updateDashboard() {
  const totalExpense = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const balance = totalIncome - totalExpense;
  const totalBudget = Object.values(budgets).reduce((sum, b) => sum + b, 0);
  const budgetUsed = totalBudget > 0 ? ((totalExpense / totalBudget) * 100).toFixed(1) : 0;

  document.getElementById('total-income').innerText = `? ${totalIncome.toLocaleString('en-IN')}`;
  document.getElementById('total-expense').innerText = `? ${totalExpense.toLocaleString('en-IN')}`;
  document.getElementById('balance').innerText = `? ${balance.toLocaleString('en-IN')}`;
  document.getElementById('budget-used').innerText = `${budgetUsed}%`;

  updateTransactionsList();
  updateCategoriesList();
  updateBudgetsList();
  updateRemindersList();
  updateAlertsList();

  const incomeHint = document.getElementById('income-hint');
  const expenseHint = document.getElementById('expense-hint');
  if (incomeHint) incomeHint.innerText = `Current Income: ? ${totalIncome.toLocaleString('en-IN')}`;
  if (expenseHint) expenseHint.innerText = `Current total expense: ? ${totalExpense.toLocaleString('en-IN')}`;
}

function updateTransactionsList() {
  const container = document.getElementById('transactions-list');
  if (!container) return;

  const expenseItems = expenses.map((expense) => ({
    id: expense.id,
    type: 'expense',
    description: expense.note || expense.category,
    category: expense.category,
    amount: Number(expense.amount),
    date: expense.date,
  }));

  const allItems = [...transactions, ...expenseItems].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (allItems.length === 0) {
    container.innerHTML = '<div class="empty-state">No transactions yet</div>';
    return;
  }

  container.innerHTML = allItems.slice(0, 5).map((item) => `
    <div class="transaction-item">
      <div>
        <span class="transaction-badge ${item.amount >= 0 ? 'badge-income' : 'badge-expense'}">
          ${item.amount >= 0 ? 'Income' : 'Expense'}
        </span>
        ${item.description}
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="${item.amount >= 0 ? 'badge-income' : 'badge-expense'}">
          ${item.amount >= 0 ? '+' : '-'}? ${Math.abs(item.amount).toLocaleString('en-IN')}
        </span>
        ${item.type === 'expense' ? `<button class="delete-btn" onclick="deleteExpense('${item.id}')">???</button>` : ''}
      </div>
    </div>
  `).join('');
}

function updateCategoriesList() {
  const container = document.getElementById('category-list');
  if (!container) return;

  const categoryMap = expenses.reduce((map, expense) => {
    map[expense.category] = (map[expense.category] || 0) + Number(expense.amount);
    return map;
  }, {});

  if (Object.keys(categoryMap).length === 0) {
    container.innerHTML = '<div class="empty-state">No expenses yet</div>';
    return;
  }

  const totalExpense = Object.values(categoryMap).reduce((sum, value) => sum + value, 0);
  const colors = {
    'Food & Dining': '#10b981',
    Rent: '#ef4444',
    Utilities: '#3b82f6',
    Transport: '#f97316',
    Entertainment: '#8b5cf6',
    Shopping: '#ec489a',
    Healthcare: '#06b6d4',
    Education: '#84cc16',
    Other: '#6b7280',
  };

  container.innerHTML = Object.entries(categoryMap).map(([category, amount]) => {
    const percent = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
    return `
      <div class="category-item">
        <div class="category-header">
          <span>${category}</span>
          <span>? ${amount.toLocaleString('en-IN')}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percent}%; background: ${colors[category] || '#6b7280'}"></div>
        </div>
        <div style="font-size: 0.7rem; margin-top: 4px;">${percent}% of total</div>
      </div>
    `;
  }).join('');
}

function updateBudgetsList() {
  const container = document.getElementById('budgets-list');
  if (!container) return;

  if (Object.keys(budgets).length === 0) {
    container.innerHTML = '<div class="empty-state">No budgets set</div>';
    return;
  }

  const spending = expenses.reduce((map, expense) => {
    map[expense.category] = (map[expense.category] || 0) + Number(expense.amount);
    return map;
  }, {});

  container.innerHTML = Object.entries(budgets).map(([category, budget]) => {
    const spent = spending[category] || 0;
    const percent = budget > 0 ? ((spent / budget) * 100).toFixed(1) : 0;
    const color = percent >= 90 ? '#ef4444' : percent >= 70 ? '#f59e0b' : '#10b981';
    return `
      <div class="budget-item">
        <div class="budget-header">
          <span>${category}</span>
          <span>? ${spent.toLocaleString('en-IN')} / ? ${budget.toLocaleString('en-IN')}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(percent, 100)}%; background: ${color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function updateRemindersList() {
  const container = document.getElementById('reminders-list');
  if (!container) return;

  const upcoming = reminders.filter((reminder) => !reminder.completed).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (upcoming.length === 0) {
    container.innerHTML = '<div class="empty-state">No upcoming reminders</div>';
    return;
  }

  container.innerHTML = upcoming.map((reminder) => `
    <div class="reminder-item">
      <input type="checkbox" class="reminder-checkbox" onchange="completeReminder(${reminder.id})">
      <div class="reminder-info">
        <div class="reminder-title">${reminder.title}</div>
        <div class="reminder-date">?? ${new Date(reminder.date).toLocaleDateString('en-IN')} � ${reminder.type}</div>
      </div>
      <button class="delete-btn" onclick="deleteReminder(${reminder.id})">???</button>
    </div>
  `).join('');
}

function updateAlertsList() {
  const container = document.getElementById('alerts-list');
  if (!container) return;
  if (alerts.length === 0) {
    container.innerHTML = '<div class="empty-state">No alerts</div>';
    return;
  }

  container.innerHTML = alerts.map((item) => `
    <div class="alert-item alert-${item.type}">
      <strong>${item.title}</strong><br>
      ${item.message}<br>
      <small>${new Date(item.date).toLocaleDateString('en-IN')}</small>
    </div>
  `).join('');
}

function setIncomeAction(action) {
  currentIncomeAction = action;
  const tabs = document.querySelectorAll('#income-modal .action-tab');
  tabs.forEach((tab) => tab.classList.toggle('active', tab.textContent.includes(action === 'add' ? 'Add' : action === 'subtract' ? 'Subtract' : 'Modify')));
  const label = document.getElementById('income-label');
  const hint = document.getElementById('income-hint');
  if (label) label.textContent = action === 'add' ? 'Amount to Add (?)' : action === 'subtract' ? 'Amount to Subtract (?)' : 'New Income Amount (?)';
  if (hint) hint.textContent = `Current Income: ? ${totalIncome.toLocaleString('en-IN')}`;
}

function setExpenseAction(action) {
  currentExpenseAction = action;
  const tabs = document.querySelectorAll('#expense-modal .action-tab');
  tabs.forEach((tab) => tab.classList.toggle('active', tab.textContent.includes(action === 'add' ? 'Add New' : action === 'subtract' ? 'Subtract' : 'Modify')));
  const selectGroup = document.getElementById('expense-select-group');
  if (selectGroup) selectGroup.style.display = 'none';
  const hint = document.getElementById('expense-hint');
  if (hint) hint.textContent = action === 'add' ? 'Enter a new expense amount' : 'Only new expenses are saved through Firebase';
}

function openIncomeModal() {
  const modal = document.getElementById('income-modal');
  if (modal) modal.style.display = 'block';
  setIncomeAction('add');
  const input = document.getElementById('income-amount');
  if (input) input.value = '';
}

function closeIncomeModal() {
  const modal = document.getElementById('income-modal');
  if (modal) modal.style.display = 'none';
}

function openExpenseModal() {
  const modal = document.getElementById('expense-modal');
  if (modal) modal.style.display = 'block';
  setExpenseAction('add');
  const amountInput = document.getElementById('expense-amount');
  const dateInput = document.getElementById('expense-date');
  if (amountInput) amountInput.value = '';
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
}

function closeExpenseModal() {
  const modal = document.getElementById('expense-modal');
  if (modal) modal.style.display = 'none';
}

function openBudgetModal() {
  const modal = document.getElementById('budget-modal');
  if (modal) modal.style.display = 'block';
  const input = document.getElementById('budget-amount');
  if (input) input.value = '';
}

function closeBudgetModal() {
  const modal = document.getElementById('budget-modal');
  if (modal) modal.style.display = 'none';
}

function openReminderModal() {
  const modal = document.getElementById('reminder-modal');
  if (modal) modal.style.display = 'block';
  const dateInput = document.getElementById('reminder-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
}

function closeReminderModal() {
  const modal = document.getElementById('reminder-modal');
  if (modal) modal.style.display = 'none';
}

function clearAlerts() {
  alerts = [];
  saveLocalData();
  updateAlertsList();
}

function exportData() {
  const data = { totalIncome, expenses, budgets, reminders, alerts, transactions };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `financepro_export_${new Date().toISOString().split('T')[0]}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  addAlert('success', 'Export complete', 'Your data has been exported locally.');
}

function completeReminder(id) {
  reminders = reminders.map((reminder) => (reminder.id === id ? { ...reminder, completed: true } : reminder));
  saveLocalData();
  updateRemindersList();
}

function deleteReminder(id) {
  if (!confirm('Delete this reminder?')) return;
  reminders = reminders.filter((reminder) => reminder.id !== id);
  saveLocalData();
  updateRemindersList();
}

function attachFormHandlers() {
  const incomeForm = document.getElementById('income-form');
  const expenseForm = document.getElementById('expense-form');
  const budgetForm = document.getElementById('budget-form');
  const reminderForm = document.getElementById('reminder-form');

  if (incomeForm) {
    incomeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const amount = parseFloat(document.getElementById('income-amount').value);
      const description = document.getElementById('income-desc').value.trim();
      if (Number.isNaN(amount) || amount <= 0) {
        alert('Please enter a valid income amount.');
        return;
      }
      if (currentIncomeAction === 'add') {
        totalIncome += amount;
        addToHistory('income', description || 'Income added', 'Income', amount);
        addAlert('success', 'Income saved', `? ${amount.toLocaleString('en-IN')} added to your balance.`);
      } else if (currentIncomeAction === 'subtract') {
        if (amount > totalIncome) {
          alert('Cannot subtract more than total income');
          return;
        }
        totalIncome -= amount;
        addToHistory('expense', description || 'Income reduction', 'Income', amount);
        addAlert('warning', 'Income reduced', `? ${amount.toLocaleString('en-IN')} removed from income.`);
      } else {
        totalIncome = amount;
        addAlert('info', 'Income updated', `Income set to ? ${amount.toLocaleString('en-IN')}.`);
      }
      saveLocalData();
      updateDashboard();
      closeIncomeModal();
      incomeForm.reset();
    });
  }

  if (expenseForm) {
    expenseForm.addEventListener('submit', submitExpense);
  }

  if (budgetForm) {
    budgetForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const category = document.getElementById('budget-category').value;
      const amount = parseFloat(document.getElementById('budget-amount').value);
      if (Number.isNaN(amount) || amount <= 0) {
        alert('Please enter a valid budget amount.');
        return;
      }
      budgets[category] = amount;
      saveLocalData();
      updateBudgetsList();
      updateDashboard();
      closeBudgetModal();
      addAlert('info', 'Budget updated', `Budget for ${category} set to ? ${amount.toLocaleString('en-IN')}.`);
    });
  }

  if (reminderForm) {
    reminderForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const title = document.getElementById('reminder-title').value.trim();
      const date = document.getElementById('reminder-date').value;
      const type = document.getElementById('reminder-type').value;
      const amount = parseFloat(document.getElementById('reminder-amount').value);
      if (!title || !date) {
        alert('Please fill in the reminder title and date.');
        return;
      }
      reminders.push({ id: Date.now(), title, date, type, amount: Number.isNaN(amount) ? null : amount, completed: false });
      saveLocalData();
      updateRemindersList();
      closeReminderModal();
      reminderForm.reset();
      addAlert('success', 'Reminder added', `${title} is saved for ${date}.`);
    });
  }

  window.openIncomeModal = openIncomeModal;
  window.closeIncomeModal = closeIncomeModal;
  window.openExpenseModal = openExpenseModal;
  window.closeExpenseModal = closeExpenseModal;
  window.openBudgetModal = openBudgetModal;
  window.closeBudgetModal = closeBudgetModal;
  window.openReminderModal = openReminderModal;
  window.closeReminderModal = closeReminderModal;
  window.setIncomeAction = setIncomeAction;
  window.setExpenseAction = setExpenseAction;
  window.clearAlerts = clearAlerts;
  window.exportData = exportData;
  window.completeReminder = completeReminder;
  window.deleteReminder = deleteReminder;
  window.deleteExpense = deleteExpense;
  window.logout = logout;
}

async function initApp() {
  await initFirebase();
  currentUser = getAuthUser();
  if (!currentUser) {
    logout();
    return;
  }

  updateUserHeader();
  loadLocalData();
  attachFormHandlers();
  setIncomeAction('add');
  setExpenseAction('add');
  await loadExpenses();
}

window.addEventListener('DOMContentLoaded', initApp);
