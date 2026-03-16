import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// distディレクトリ内の静的ファイルを配信する
app.use(express.static(path.join(__dirname, 'dist')));

// APIルートなどが必要な場合はここに記述する
// 例: app.get('/api/status', (req, res) => res.json({ status: 'ok' }));

// それ以外のすべてのリクエストは、Reactアプリ (SPA) の index.html にルーティングする
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
