import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('[v0] FEPMS initializing...');

try {
  const root = document.getElementById('root');
  console.log('[v0] Root element:', root);
  
  createRoot(root!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('[v0] React rendered successfully');
} catch (error) {
  console.error('[v0] Render error:', error);
}
