import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// import './index.css' // Already created index.html with styles, but let's keep this if needed or remove. 
// I didn't create src/index.css, I put styles in index.html. So I should remove this import or create the file.
// I'll remove the import to be safe.

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
