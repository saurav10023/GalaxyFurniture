import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout.jsx'
import Home from './Home/Home.jsx'

import AdminLogin from './pages/Login.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AdminRoutes from './routes/AdminRoutes.jsx'

const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout/>,
      children: [
        { index: true, element: <Home/> },
        { path: "/login", element: <AdminLogin/> },
        { path: "/admin/*", element: <AdminRoutes/> },
      ]
    }
  ])

createRoot(document.getElementById('root')).render(

  <StrictMode>
    <AuthProvider>
        <RouterProvider router={router}/>
    </AuthProvider>
  </StrictMode>,
)