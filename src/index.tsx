import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { StoreProvider } from './store';
import { configure } from 'mobx';

configure({ enforceActions: 'never' });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StoreProvider>
    <App />
  </StoreProvider>
);
