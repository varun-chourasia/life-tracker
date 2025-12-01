import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 🔒 SECURITY: Disable console logs in production and warn users
if (import.meta.env.PROD) {
  // 1. Save the original console methods just in case, but hide them from the global scope if possible or just override.
  // Overriding is standard for "disabling" access.
  
  // 2. Print a warning message before clearing (so it's the first thing seen if they persist logs)
  console.log(
    "%cSTOP!",
    "color: red; font-size: 40px; font-weight: bold; text-shadow: 2px 2px 0px black;"
  );
  console.log(
    "%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or 'hack' someone's account, it is a scam and will give them access to your Chronoly account.",
    "font-size: 16px; font-family: sans-serif; color: #444;"
  );

  // 3. Override methods to prevent further logging by the app or third-party scripts
  // Note: This doesn't prevent a user from typing in the console, but it hides app output.
  // To truly "disable" the console is impossible in a browser, but this is the standard "private" practice.
  window.console.log = () => {};
  window.console.info = () => {};
  window.console.warn = () => {};
  window.console.error = () => {};
  window.console.debug = () => {};
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)