import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// As telas usam a fonte de ícones Phosphor (`ph ph-*` / `ph-fill ph-*`),
// igual ao design_handoff_trackerr — sem estas folhas todo <i className="ph …">
// renderiza vazio. Mesma versão (2.1.1) do handoff, servida pelo próprio app.
import '@phosphor-icons/web/regular';
import '@phosphor-icons/web/fill';
import './index.css';
import './lib/interceptors';

createRoot(document.getElementById('root')!).render(<App />);
