import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import About from './pages/About'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Go from './pages/Go'
import Stats from './pages/Stats'
import Me from './pages/Me'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Protected routes */}
        <Route path="dashboard" element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        } />
        <Route path="me" element={
          <RequireAuth>
            <Me />
          </RequireAuth>
        } />

        {/* Public routes */}
        <Route path="go/:short_code" element={<Go />} />
        <Route path="stats/:short_code" element={<Stats />} />
      </Route>
    </Routes>
  )
}

export default App
