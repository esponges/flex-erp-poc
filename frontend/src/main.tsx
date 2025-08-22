import './global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const container = document.querySelector('#root')

if (container) {
  const root = createRoot(container)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
} else {
  throw new Error('Failed to find the root element')
}