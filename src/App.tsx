import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NhostClient, NhostProvider } from '@nhost/react';
import { NhostApolloProvider } from '@nhost/react-apollo';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NewsFeed from './pages/NewsFeed';
import SavedArticles from './pages/SavedArticles';
import ProtectedRoute from './components/ProtectedRoute';

// Create Nhost client with localStorage persistence
export const nhost = new NhostClient({
  subdomain: import.meta.env.VITE_NHOST_SUBDOMAIN || '',
  region: import.meta.env.VITE_NHOST_REGION || '',
  autoRefreshToken: true,
  autoSignIn: true,
  clientStorageType: 'localStorage',   // Ensure we use localStorage
});

// Alternative configuration if the above doesn't work
// Uncomment this and comment out the above configuration if you continue to have issues
/*
export const nhost = new NhostClient({
  authUrl: '/nhost/v1',
  storageUrl: '/nhost/storage/v1',
  graphqlUrl: '/nhost/v1/graphql',
  functionsUrl: '/nhost/v2/functions',
  autoRefreshToken: true,
  autoSignIn: true,
  clientStorageType: 'localStorage',
});
*/

// Log token on initialization
nhost.auth.onAuthStateChanged((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const token = session.accessToken;
    console.log('User signed in with token:', token);
    
    // Store token in localStorage with our custom handler too
    localStorage.setItem('nhost-jwt-token', token);
    
    // Store token expiry information
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + (session.accessTokenExpiresIn || 0));
    localStorage.setItem('nhost-token-expires', tokenExpiry.toISOString());
  }
});

function App() {
  return (
    <NhostProvider nhost={nhost}>
      <NhostApolloProvider nhost={nhost}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <NewsFeed />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/saved"
                  element={
                    <ProtectedRoute>
                      <SavedArticles />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Toaster position="top-right" />
          </div>
        </Router>
      </NhostApolloProvider>
    </NhostProvider>
  );
}

export default App;
