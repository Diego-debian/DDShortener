import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
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
        <Route index element={<About />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="go/:short_code" element={<Go />} />
        <Route path="stats/:short_code" element={<Stats />} />
        <Route path="me" element={<Me />} />
      </Route>
    </Routes>
  )
}

export default App
