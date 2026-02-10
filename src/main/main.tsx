import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../app/App'
import "./index.scss";
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import { TitleManager } from '../contexts/TitleContext';


const rootElement = document.getElementById('root');

createRoot(rootElement!).render(
  <StrictMode>
    <TitleManager>
      <ConfirmDialog>
        <App />
      </ConfirmDialog>
    </TitleManager>
  </StrictMode>,
)