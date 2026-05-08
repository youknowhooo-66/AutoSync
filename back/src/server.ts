import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 AutoSync ERP Backend running on http://localhost:${PORT}`);
});
