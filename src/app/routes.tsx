import { createBrowserRouter, Outlet, Navigate } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Trail } from "./pages/Trail";
import { Challenge } from "./pages/Challenge";
import { Ranking } from "./pages/Ranking";
import { Profile } from "./pages/Profile";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminChallenges } from "./pages/AdminChallenges";
import { AdminChallengeEdit } from "./pages/AdminChallengeEdit";
import { AdminEvents } from "./pages/AdminEvents";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/trail", element: <Trail /> },
          { path: "/challenge/:id", element: <Challenge /> },
          { path: "/ranking", element: <Ranking /> },
          { path: "/profile/:username", element: <Profile /> },
          {
            element: <AdminRoute />,
            children: [
              { path: "/admin", element: <AdminDashboard /> },
              { path: "/admin/challenges", element: <AdminChallenges /> },
              { path: "/admin/challenges/new", element: <AdminChallengeEdit /> },
              { path: "/admin/challenges/edit/:id", element: <AdminChallengeEdit /> },
              { path: "/admin/events", element: <AdminEvents /> },
            ],
          },
        ],
      },
    ],
  },
]);
