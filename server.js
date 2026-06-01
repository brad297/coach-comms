const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || 'fivestars';

// Login page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Coach Comms — Five Star Solutions</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1923; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .card { background: #1a2535; border-radius: 16px; padding: 32px 24px; max-width: 360px; width: 100%; border: 1px solid #2a3a4d; }
  .logo { font-size: 12px; font-weight: 600; color: #c9a84c; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 24px; }
  .title { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  .sub { font-size: 14px; color: #8899aa; margin-bottom: 28px; line-height: 1.5; }
  .field-label { font-size: 11px; font-weight: 600; color: #8899aa; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; display: block; }
  .field-input { width: 100%; background: #0f1923; border: 1px solid #2a3a4d; border-radius: 10px; padding: 14px; font-size: 16px; color: #fff; outline: none; -webkit-appearance: none; margin-bottom: 16px; }
  .field-input:focus { border-color: #c9a84c; }
  .btn { width: 100%; padding: 16px; background: #c9a84c; color: #0f1923; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; }
  .btn:active { background: #d4b563; }
  .error { background: #2a1a1a; border: 1px solid #e57373; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #e57373; margin-bottom: 16px; display: none; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">Five Star Solutions</div>
  <div class="title">Coach Comms</div>
  <div class="sub">Draft client messages in your voice. Enter your access password to continue.</div>
  <div class="error" id="error">Incorrect password. Try again.</div>
  <label class="field-label">Access Password</label>
  <input class="field-input" type="password" id="password" placeholder="Enter password" onkeydown="if(event.key==='Enter')unlock()">
  <button class="btn" onclick="unlock()">Enter</button>
</div>
<script>
function unlock() {
  const pwd = document.getElementById('password').value.trim();
  fetch('/api/unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pwd })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      window.location.href = '/app/' + encodeURIComponent(pwd);
    } else {
      document.getElementById('error').style.display = 'block';
      document.getElementById('password').value = '';
    }
  }).catch(() => {
    document.getElementById('error').style.display = 'block';
  });
}
</script>
</body>
</html>`);
});

// Unlock check
app.post('/api/unlock', (req, res) => {
  const { password } = req.body;
  res.json({ success: password === ACCESS_PASSWORD });
});

// Protected app — password in URL path
app.get('/app/:token', (req, res) => {
  if (req.params.token !== ACCESS_PASSWORD) {
    return res.redirect('/');
  }
  res.sendFile('index.html', { root: '.' });
});

// Protect API with token in body
app.post('/api/chat', async (req, res) => {
  const token = req.body?._token;
  if (token !== ACCESS_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { _token, ...body } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static('.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Coach Comms running on port ${PORT}`);
});
