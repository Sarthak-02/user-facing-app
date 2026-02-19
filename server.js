import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the dist directory at /app path
app.use('/app', express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Handle client-side routing - send all /app requests to index.html
// EXCEPT for requests that look like static files (have a file extension)
app.get('/app/*', (req, res, next) => {
  // If the request has a file extension, it's a static file request
  // that wasn't found - don't serve index.html
  if (path.extname(req.path)) {
    return next();
  }
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Redirect root to /app
app.get('/', (req, res) => {
  res.redirect('/app/');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
