import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { HomePage } from './pages/HomePage/HomePage';
import { DashboardPage } from './pages/DashboardPage/DashboardPage';
import { EntryPage } from './pages/EntryPage/EntryPage';
import { TodosPage } from './pages/TodosPage/TodosPage';

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
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
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
      <Route
        path="/todos"
        element={
          <RequireAuth>
            <TodosPage />
          </RequireAuth>
        }
      />
    </Routes>
  </BrowserRouter>
);
