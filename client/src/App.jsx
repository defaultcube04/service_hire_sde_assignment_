import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Marketplace from './pages/Marketplace.jsx';
import Requests from './pages/Requests.jsx';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }) {
  const { token, logout, user } = useAuth();
  return (
    <div className="app-container">
      <header className="header">
        <h2>SlotSwapper</h2>
        <nav>
          {token ? (
            <>
              <Link to="/" className="header-link">Dashboard</Link>
              <Link to="/marketplace" className="header-link">Marketplace</Link>
              <Link to="/requests" className="header-link">Requests</Link>
              {user && <span className="text-muted" style={{ marginRight: 8 }}>Hi, {user.name}!</span>}
              <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="header-link">Login</Link>
              <Link to="/signup" className="header-link">Sign Up</Link>
            </>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}


