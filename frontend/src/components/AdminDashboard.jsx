import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Search,
  Plus,
  Trash2,
  KeyRound,
  LogOut,
  RefreshCw,
  AlertTriangle,
  X,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { api } from "../api";

export default function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState({
    total_users: 0,
    total_faculty: 0,
    total_students: 0,
    total_documents: 0,
    total_quiz_attempts: 0,
  });

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [facultyList, setFacultyList] = useState([]);

  // Toast / Error state
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text: '' }

  // Modals state
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    password: "",
    role: "faculty",
    subject_name: "",
    faculty_id: "",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sData, uData, fData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getFacultyList().catch(() => []),
      ]);
      setStats(sData);
      setUsersList(uData);
      setFacultyList(fData);
    } catch (err) {
      showToast("error", err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.subject_name && u.subject_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.faculty_name && u.faculty_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Action handlers
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 4) {
      showToast("error", "Password must be at least 4 characters.");
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await api.resetUserPassword(resetModalUser.id, newPassword.trim());
      showToast("success", res.message || `Password reset for ${resetModalUser.name}`);
      setResetModalUser(null);
      setNewPassword("");
    } catch (err) {
      showToast("error", err.message || "Failed to reset password");
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    setDeleteSubmitting(true);
    try {
      const res = await api.deleteAdminUser(deleteModalUser.id);
      showToast("success", res.message || "User account removed.");
      setDeleteModalUser(null);
      fetchData();
    } catch (err) {
      showToast("error", err.message || "Failed to delete user");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.password.trim()) {
      showToast("error", "Please provide both username and password.");
      return;
    }

    setCreateSubmitting(true);
    try {
      const fId = createForm.role === "student" && createForm.faculty_id ? Number(createForm.faculty_id) : null;
      await api.createAdminUser(
        createForm.name.trim(),
        createForm.password.trim(),
        createForm.role,
        createForm.subject_name.trim(),
        fId
      );
      showToast("success", `New ${createForm.role} account created successfully!`);
      setShowCreateModal(false);
      setCreateForm({ name: "", password: "", role: "faculty", subject_name: "", faculty_id: "" });
      fetchData();
    } catch (err) {
      showToast("error", err.message || "Failed to create user account");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-800/80"
              : "bg-rose-950/90 text-rose-300 border-rose-800/80"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              VCE AI Tutor Control Deck
            </h1>
            <p className="text-xs text-slate-400 font-mono">System Administrator Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-medium border border-slate-700/60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{user?.name || "Admin"}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                Super Admin
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition flex items-center gap-1 text-xs font-medium"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Registered</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">{stats.total_users}</p>
            <p className="text-[11px] text-slate-400 mt-2">Active platform accounts</p>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Card 2: Faculty Count */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Faculty Members</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">{stats.total_faculty}</p>
            <p className="text-[11px] text-slate-400 mt-2">Course creators & instructors</p>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Card 3: Student Count */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Enrolled Students</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">{stats.total_students}</p>
            <p className="text-[11px] text-slate-400 mt-2">Active learners enrolled</p>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Card 4: Indexed Documents */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Syllabus PDFs</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">{stats.total_documents}</p>
            <p className="text-[11px] text-slate-400 mt-2">Indexed vector store documents</p>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          </div>
        </div>

        {/* User Directory Management Table */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
          {/* Header Controls */}
          <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>User Directory & Credentials Management</span>
                <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {filteredUsers.length} total
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage credentials, roles, and platform permissions.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search user or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Role Filter Dropdown */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="faculty">Faculty Only</option>
                <option value="student">Student Only</option>
                <option value="admin">Admin Only</option>
              </select>

              {/* Create User Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase text-[11px] font-semibold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">User / ID</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Subject / Faculty</th>
                  <th className="px-5 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
                      <span>Loading user accounts...</span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      No accounts matched your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      {/* Name & ID */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{u.name}</p>
                            <span className="text-[10px] font-mono text-slate-500">ID: #{u.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-3.5">
                        {u.role === "admin" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 font-semibold text-[10px]">
                            <Shield className="h-3 w-3" /> Admin
                          </span>
                        )}
                        {u.role === "faculty" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold text-[10px]">
                            <GraduationCap className="h-3 w-3" /> Faculty
                          </span>
                        )}
                        {u.role === "student" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold text-[10px]">
                            <BookOpen className="h-3 w-3" /> Student
                          </span>
                        )}
                      </td>

                      {/* Subject / Faculty */}
                      <td className="px-5 py-3.5 text-slate-300">
                        {u.role === "faculty" ? (
                          <span className="font-medium text-slate-200">{u.subject_name || "—"}</span>
                        ) : u.role === "student" ? (
                          <span className="text-slate-400">
                            Faculty: <strong className="text-slate-200">{u.faculty_name || "Unassigned"}</strong>
                          </span>
                        ) : (
                          <span className="text-slate-500">System Admin</span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">{u.created_at}</td>

                      {/* Action Buttons */}
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => setResetModalUser(u)}
                          className="px-2.5 py-1 rounded bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/50 transition inline-flex items-center gap-1 text-[11px] font-medium"
                          title="Reset Password"
                        >
                          <KeyRound className="h-3 w-3" />
                          <span>Reset Password</span>
                        </button>

                        {u.id !== user?.id && (
                          <button
                            onClick={() => setDeleteModalUser(u)}
                            className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 transition inline-flex items-center gap-1 text-[11px] font-medium"
                            title="Remove Account"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL 1: Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-blue-400" />
                <span>Reset Password</span>
              </h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Set a new plain password for user{" "}
              <strong className="text-slate-200 font-semibold">{resetModalUser.name}</strong> ({resetModalUser.role}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 4 characters)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {resetSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete User Confirmation */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Remove Account</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg text-xs text-slate-300">
              Are you sure you want to permanently delete account{" "}
              <strong className="text-rose-300">{deleteModalUser.name}</strong> ({deleteModalUser.role})? All associated
              quiz records and documents will be deleted.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {deleteSubmitting ? "Removing..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-indigo-400" />
                <span>Create New User Account</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. john_doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Account Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="faculty">Faculty (Teacher)</option>
                  <option value="student">Student</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {createForm.role === "faculty" && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={createForm.subject_name}
                    onChange={(e) => setCreateForm({ ...createForm, subject_name: e.target.value })}
                    placeholder="e.g., Computer Networks"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              {createForm.role === "student" && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assign to Faculty / Subject</label>
                  <select
                    value={createForm.faculty_id}
                    onChange={(e) => setCreateForm({ ...createForm, faculty_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Faculty...</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {f.subject_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-1.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {createSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
