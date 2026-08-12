// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const { seed } = require('./db/db');
const { router: authRouter } = require('./routes/auth');
const lessonsRouter = require('./routes/lessons');
const aiTrainerRouter = require('./routes/aiTrainer');

// Make sure the A-Z roadmap + sample lessons exist on first boot
seed();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRouter);
app.use('/api', lessonsRouter);        // /api/levels, /api/lessons/:id, etc.
app.use('/api/ai', aiTrainerRouter);   // /api/ai/ask, /api/ai/sessions

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`English Trainer API running on http://localhost:${PORT}`);
});
