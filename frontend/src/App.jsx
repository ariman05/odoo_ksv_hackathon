import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Vendors from './pages/Vendors.jsx';
import RFQs from './pages/RFQs.jsx';
import Quotations from './pages/Quotations.jsx';
import Approvals from './pages/Approvals.jsx';
import PurchaseOrders from './pages/PurchaseOrders.jsx';
import Activity from './pages/Activity.jsx';
import Reports from './pages/Reports.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component to protect private routes
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Main Application Layout */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/vendors" element={<Vendors />} />
                    <Route path="/rfqs" element={<RFQs />} />
                    <Route path="/quotations" element={<Quotations />} />
                    <Route path="/approvals" element={<Approvals />} />
                    <Route path="/purchase-orders" element={<PurchaseOrders />} />
                    <Route path="/activity" element={<Activity />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
