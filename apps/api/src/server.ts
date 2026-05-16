import 'dotenv/config';
import app from './app';

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AutoSync ERP Backend running on http://0.0.0.0:${PORT}`);
});
