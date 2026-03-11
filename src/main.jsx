import React from 'react'
import ReactDOM from 'react-dom/client'
import moment from 'moment'
import 'moment/locale/it'
import App from '@/App.jsx'
import '@/index.css'

moment.locale('it')

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
