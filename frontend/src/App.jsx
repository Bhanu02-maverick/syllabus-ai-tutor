import React, { useState, Component } from "react";
import Login from "./components/Login.jsx";
import StudentPortal from "./components/StudentPortal.jsx";
import FacultyDashboard from "./components/FacultyDashboard.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import { api } from "./api";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught UI Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-slate-900">Application Notice</h2>
            <p className="text-xs text-slate-500">
              An unexpected render error occurred. Please click below to refresh the dashboard.
            </p>
            <p className="text-xs text-rose-600 font-mono bg-rose-50 p-3 rounded-lg border border-rose-100 break-words text-left max-h-32 overflow-y-auto">
              {this.state.error?.toString() || "Unknown error"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 transition cursor-pointer"
              >
                Reload Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-300 transition cursor-pointer"
              >
                Reset Session & Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const handleUnauthorized = () => {
      api.setToken(null);
      setUser(null);
    };
    window.addEventListener("vce_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("vce_unauthorized", handleUnauthorized);
  }, []);

  const handleLogin = (userData) => {
    if (userData && userData.token) {
      api.setToken(userData.token);
      localStorage.setItem("vce_user", JSON.stringify(userData));
    }
    setUser(userData);
  };

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
  };

  const renderContent = () => {
    if (!user) {
      return <Login onLogin={handleLogin} />;
    }

    if (user.role === "admin") {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    }

    if (user.role === "faculty") {
      return <FacultyDashboard user={user} onLogout={handleLogout} />;
    }

    return <StudentPortal user={user} onLogout={handleLogout} />;
  };

  return <ErrorBoundary>{renderContent()}</ErrorBoundary>;
}
