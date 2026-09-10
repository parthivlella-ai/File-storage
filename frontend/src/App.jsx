import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FileProvider } from './context/FileContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout & Guards
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MyFilesPage from './pages/MyFilesPage';
import RecentPage from './pages/RecentPage';
import FoldersPage from './pages/FoldersPage';
import StarredPage from './pages/StarredPage';
import TrashPage from './pages/TrashPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <FileProvider>
            <Router>
              <Routes>
                {/* Public Authentication Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected User Workspace Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/my-files" element={<MyFilesPage />} />
                    <Route path="/recent" element={<RecentPage />} />
                    <Route path="/folders" element={<FoldersPage />} />
                    <Route path="/starred" element={<StarredPage />} />
                    <Route path="/trash" element={<TrashPage />} />
                    <Route path="/settings" element={<SettingsPage />} />

                    {/* Protected Admin Routes */}
                    <Route element={<ProtectedRoute requireAdmin={true} />}>
                      <Route path="/admin" element={<AdminPage />} />
                    </Route>

                    {/* Fallback 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Route>
              </Routes>
            </Router>
          </FileProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
