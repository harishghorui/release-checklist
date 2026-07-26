"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  RELEASE_STEPS,
  computeStatus,
} from "@/constants/steps";
import {
  Plus,
  Eye,
  Trash2,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  ArrowLeft,
  Save,
  Search,
  X,
  FileText,
  CheckSquare,
  AlertCircle,
  Check,
  RefreshCw,
} from "lucide-react";

interface Release {
  id: string;
  name: string;
  date: string;
  additionalInfo: string | null;
  completedSteps: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ReleaseChecklistPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // View state: null = list view, string = detail view for specific release id
  const [activeReleaseId, setActiveReleaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newForm, setNewForm] = useState({
    name: "",
    date: "",
    additionalInfo: "",
  });

  useEffect(() => {
    setMounted(true);
    setNewForm((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
  }, []);

  // Edit / Detail view state
  const [editForm, setEditForm] = useState<{
    name: string;
    date: string;
    additionalInfo: string;
    completedSteps: string[];
  }>({
    name: "",
    date: "",
    additionalInfo: "",
    completedSteps: [],
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  // Fetch all releases
  const fetchReleases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/releases");
      if (!res.ok) throw new Error("Failed to fetch releases");
      const data = await res.json();
      setReleases(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  // Find active release object
  const activeRelease = useMemo(() => {
    return releases.find((r) => r.id === activeReleaseId) || null;
  }, [releases, activeReleaseId]);

  // Sync editForm when activeRelease changes
  useEffect(() => {
    if (activeRelease) {
      setEditForm({
        name: activeRelease.name,
        date: activeRelease.date ? new Date(activeRelease.date).toISOString().split("T")[0] : "",
        additionalInfo: activeRelease.additionalInfo || "",
        completedSteps: activeRelease.completedSteps || [],
      });
    }
  }, [activeRelease]);

  // Filtered releases for list view
  const filteredReleases = useMemo(() => {
    if (!searchQuery.trim()) return releases;
    const q = searchQuery.toLowerCase();
    return releases.filter((r) => r.name.toLowerCase().includes(q));
  }, [releases, searchQuery]);

  // Handle Create Release submit
  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.date) {
      showToast("Please provide a name and date", "error");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newForm.name.trim(),
          date: newForm.date,
          additionalInfo: newForm.additionalInfo.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create release");
      }

      const created = await res.json();
      setReleases((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewForm({
        name: "",
        date: new Date().toISOString().split("T")[0],
        additionalInfo: "",
      });
      showToast("Release created successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to create release", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Save Release (PATCH)
  const handleSaveRelease = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeReleaseId) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/releases/${activeReleaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          date: editForm.date,
          additionalInfo: editForm.additionalInfo,
          completedSteps: editForm.completedSteps,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update release");
      }

      const updated = await res.json();
      setReleases((prev) =>
        prev.map((r) => (r.id === activeReleaseId ? updated : r))
      );
      showToast("Release updated successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to update release", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Release
  const handleDeleteRelease = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this release?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/releases/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete release");
      }

      setReleases((prev) => prev.filter((r) => r.id !== id));
      if (activeReleaseId === id) {
        setActiveReleaseId(null);
      }
      showToast("Release deleted");
    } catch (err: any) {
      showToast(err.message || "Failed to delete release", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle step completion in editForm
  const toggleStep = (stepId: string) => {
    setEditForm((prev) => {
      const exists = prev.completedSteps.includes(stepId);
      const nextCompleted = exists
        ? prev.completedSteps.filter((s) => s !== stepId)
        : [...prev.completedSteps, stepId];
      return { ...prev, completedSteps: nextCompleted };
    });
  };

  // Date formatter
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
  };

  // Render Status Badge helper
  const renderStatusBadge = (completedSteps: string[]) => {
    const status = computeStatus(completedSteps);
    const count = completedSteps ? completedSteps.length : 0;
    const total = RELEASE_STEPS.length;

    if (status === "Done") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Done
        </span>
      );
    }

    if (status === "Ongoing") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 shadow-xs">
          <Loader2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-spin" />
          Ongoing ({count}/{total})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
        <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        Planned
      </span>
    );
  };

  // Has changes check
  const hasChanges = useMemo(() => {
    if (!activeRelease) return false;
    const origDate = activeRelease.date
      ? new Date(activeRelease.date).toISOString().split("T")[0]
      : "";
    const origInfo = activeRelease.additionalInfo || "";
    const origSteps = [...(activeRelease.completedSteps || [])].sort().join(",");
    const currentSteps = [...editForm.completedSteps].sort().join(",");

    return (
      editForm.name !== activeRelease.name ||
      editForm.date !== origDate ||
      editForm.additionalInfo !== origInfo ||
      origSteps !== currentSteps
    );
  }, [activeRelease, editForm]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200"
                : "bg-purple-900 border-purple-700 text-purple-50 shadow-purple-900/20"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-purple-300 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-75 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header & Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm font-medium">
            <button
              onClick={() => setActiveReleaseId(null)}
              className={`flex items-center gap-2 transition-colors ${
                activeReleaseId
                  ? "text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-semibold"
                  : "text-slate-900 dark:text-slate-100 font-bold"
              }`}
            >
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>All releases</span>
            </button>

            {activeRelease && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md font-semibold">
                  {activeRelease.name}
                </span>
              </>
            )}
          </nav>

          {/* Top Right Refresh / Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchReleases}
              disabled={!mounted || loading}
              title="Refresh releases"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${!mounted || loading ? "animate-spin" : ""}`} />
            </button>

            {!activeReleaseId && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-medium text-sm rounded-xl shadow-md shadow-purple-600/20 transition-all hover:shadow-purple-600/30 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>New release</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 flex items-center justify-between text-rose-800 dark:text-rose-300 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchReleases}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 text-xs font-semibold rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* LIST VIEW */}
        {!activeReleaseId && (
          <div className="space-y-6">
            {/* View Header & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Release Checklist
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Track and verify software deployment checklists across releases.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search releases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {loading && releases.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  <p className="text-sm font-medium">Loading releases...</p>
                </div>
              ) : filteredReleases.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {searchQuery ? "No matching releases found" : "No releases created yet"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    {searchQuery
                      ? "Try searching for another name or clear your search query."
                      : "Get started by creating your first release checklist."}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Release</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        <th className="py-3.5 px-6">Release</th>
                        <th className="py-3.5 px-6">Date</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredReleases.map((release) => (
                        <tr
                          key={release.id}
                          onClick={() => setActiveReleaseId(release.id)}
                          className="group hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors cursor-pointer"
                        >
                          {/* Release Name */}
                          <td className="py-4 px-6 font-semibold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                            {release.name}
                          </td>

                          {/* Date */}
                          <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span suppressHydrationWarning>{formatDateDisplay(release.date)}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            {renderStatusBadge(release.completedSteps)}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-6 text-right">
                            <div
                              className="flex items-center justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => setActiveReleaseId(release.id)}
                                title="View Release"
                                className="p-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100/70 dark:hover:bg-purple-900/50 rounded-xl transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRelease(release.id)}
                                title="Delete Release"
                                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DETAIL / EDIT VIEW */}
        {activeReleaseId && activeRelease && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveReleaseId(null)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                    <span>{editForm.name || "Untitled Release"}</span>
                    {renderStatusBadge(editForm.completedSteps)}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Release checklist detail & task verification
                  </p>
                </div>
              </div>

              {/* Save & Delete Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeleteRelease(activeReleaseId)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>

                <button
                  onClick={() => handleSaveRelease()}
                  disabled={isSaving || !hasChanges}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl shadow-md transition-all ${
                    hasChanges
                      ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-purple-600/20 active:scale-[0.98]"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none"
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </div>

            {/* Form Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Metadata & Remarks */}
              <div className="lg:col-span-1 space-y-6">
                {/* Release Details Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Release Information</span>
                  </h3>

                  {/* Release Name Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Release Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-medium text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Release Date Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Release Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, date: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-medium text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Additional Remarks Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Additional remarks / tasks
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Add notes, environment URLs, PR links, or special instructions..."
                    value={editForm.additionalInfo}
                    onChange={(e) =>
                      setEditForm({ ...editForm, additionalInfo: e.target.value })
                    }
                    className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-slate-900 dark:text-slate-100 resize-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Right Column: Checklist Steps */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  {/* Progress Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Release Progress
                      </span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {editForm.completedSteps.length} of {RELEASE_STEPS.length} steps completed (
                        {Math.round(
                          (editForm.completedSteps.length / RELEASE_STEPS.length) * 100
                        )}
                        %)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 transition-all duration-300 ease-out"
                        style={{
                          width: `${
                            (editForm.completedSteps.length / RELEASE_STEPS.length) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-3 pt-2">
                    {RELEASE_STEPS.map((step, idx) => {
                      const isChecked = editForm.completedSteps.includes(step.id);
                      return (
                        <label
                          key={step.id}
                          className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? "bg-purple-50/60 border-purple-200/90 dark:bg-purple-950/30 dark:border-purple-900/60"
                              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStep(step.id)}
                            className="mt-0.5 w-5 h-5 accent-purple-600 rounded cursor-pointer border-slate-300 text-purple-600 focus:ring-purple-500"
                          />

                          <div className="flex-1">
                            <span
                              className={`text-sm font-medium transition-colors ${
                                isChecked
                                  ? "line-through text-slate-500 dark:text-slate-400"
                                  : "text-slate-900 dark:text-slate-100"
                              }`}
                            >
                              <span className="font-semibold mr-2 text-slate-400 text-xs">
                                Step {idx + 1}:
                              </span>
                              {step.label}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE RELEASE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Create New Release</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRelease} className="space-y-4">
              {/* Release Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Release Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Release v1.2.0"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Release Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={newForm.date}
                  onChange={(e) => setNewForm({ ...newForm, date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Additional Info */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Additional Info / Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes, target features, or deployment remarks..."
                  value={newForm.additionalInfo}
                  onChange={(e) =>
                    setNewForm({ ...newForm, additionalInfo: e.target.value })
                  }
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-slate-900 dark:text-slate-100 resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating || !newForm.name.trim() || !newForm.date}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{isCreating ? "Creating..." : "Create Release"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
