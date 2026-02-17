import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the dist directory at /app path
app.use('/app', express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - send all /app requests to index.html
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Redirect root to /app
app.get('/', (req, res) => {
  res.redirect('/app/');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
