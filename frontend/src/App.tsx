import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { DashboardPage } from './pages/DashboardPage/DashboardPage';
import { EntryPage } from './pages/EntryPage/EntryPage';

const hasToken = (): boolean => {
  return document.cookie.split(';').some((c) => c.trim().startsWith('token='));
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  if (!hasToken()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/entry/:date"
        element={
          <RequireAuth>
            <EntryPage />
          </RequireAuth>
        }
      />
    </Routes>
  </BrowserRouter>
);
