import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../app/App'
import "./index.scss";
import ConfirmDialog from '../components/dialogs/ConfirmDialog';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfirmDialog>
      <App />
    </ConfirmDialog>
  </StrictMode>,
)
