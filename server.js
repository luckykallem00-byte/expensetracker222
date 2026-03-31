const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 FinancePro Server Started!`);
    console.log(`=================================`);
    console.log(`📍 Server running on port: ${PORT}`);
    console.log(`🔐 Login Page: /login.html`);
    console.log(`📝 Register Page: /register.html`);
    console.log(`📊 Dashboard: /index.html`);
    console.log(`=================================`);
});