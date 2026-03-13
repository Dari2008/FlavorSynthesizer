import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../app/App'
import "./index.scss";
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import { TitleManager } from '../contexts/TitleContext';
import InputDialog from '../components/dialogs/InputDialog';


const rootElement = document.getElementById('root');

if ("ontouchstart" in window) rootElement?.classList.add("touch-device");

createRoot(rootElement!).render(
  <StrictMode>
    <TitleManager>
      <InputDialog>
        <ConfirmDialog>
          <App />
        </ConfirmDialog>
      </InputDialog>
    </TitleManager>
  </StrictMode>,
)