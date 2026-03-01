"use client";

import React, { useState, useEffect } from "react";

// Inline Icons
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" /><path d="m21 2-9.6 9.6" /><circle cx="7.5" cy="15.5" r="5.5" /></svg>;
const RefreshCw = ({ className = "" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>;
const CheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>;

export default function ManagementConsole() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [updateStatus, setUpdateStatus] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restartInstances, setRestartInstances] = useState(false);
  const [sysMesg, setSysMesg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("mc_token");
    if (stored) {
      setToken(stored);
      fetchUpdateDetails(stored);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem("mc_token", data.token);
        setToken(data.token);
        fetchUpdateDetails(data.token);
      } else {
        setLoginError(data.error || "Login fehlgeschlagen.");
      }
    } catch (err) {
      setLoginError("Netzwerkfehler beim Login.");
    }
  };

  const fetchUpdateDetails = async (authToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/system/update/details", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });

      if (res.status === 401 || res.status === 403) {
        // Token invalid
        setToken(null);
        localStorage.removeItem("mc_token");
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setUpdateStatus(data);
      } else {
        setSysMesg("Fehler beim Abrufen der Updates: " + data.error);
      }
    } catch (err) {
      setSysMesg("Netzwerkfehler beim Status-Abruf.");
    }
    setIsLoading(false);
  };

  const handleExecuteUpdate = async () => {
    if (!confirm("Sollen die Updates jetzt installiert werden? Das System wird für einige Sekunden nicht erreichbar sein.")) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/system/update/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ restartInstances })
      });
      const data = await res.json();
      if (data.success) {
        setSysMesg("Update-Prozess wurde gestartet! Die Verbindung bricht gleich ab...");
        // Reload page after expected update time
        setTimeout(() => {
          window.location.reload();
        }, 15000);
      } else {
        setSysMesg("Fehler beim Starten des Updates: " + data.error);
        setIsUpdating(false);
      }
    } catch (err) {
      setSysMesg("Netzwerkfehler beim Update-Start.");
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("mc_token");
    setUpdateStatus(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-800">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600/20 p-3 rounded-full text-blue-500 inline-flex border border-blue-500/30">
              <KeyIcon />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">Management Console</h2>
          <p className="text-gray-400 text-center mb-8 text-sm">Bitte authentifizieren Sie sich mit dem System-Account.</p>

          {loginError && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">{loginError}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded transition-colors mt-4 shadow-lg shadow-blue-500/20"
            >
              Anmelden
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Awesome Management Console</h1>
            <p className="text-gray-500 text-sm mt-1">Zentrale Systemverwaltung</p>
          </div>
          <button onClick={handleLogout} className="text-sm font-medium text-gray-400 hover:text-white bg-gray-900 px-4 py-2 rounded-lg border border-gray-800 transition-colors">Abmelden</button>
        </header>

        {sysMesg && (
          <div className="bg-blue-900/20 border border-blue-800 text-blue-300 p-4 rounded-lg mb-6 shadow-Inner">
            {sysMesg}
          </div>
        )}

        <main className="space-y-6">
          <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 backdrop-blur">
              <div>
                <h2 className="text-lg font-semibold text-white">System Updates</h2>
                <p className="text-xs text-gray-400 mt-1">Überprüft das Github Repository auf neue Versionen</p>
              </div>
              <button
                onClick={() => fetchUpdateDetails(token)}
                disabled={isLoading || isUpdating}
                className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
              >
                <RefreshCw className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <RefreshCw className="animate-spin h-8 w-8 mb-4 text-blue-500" />
                  <p className="text-sm">Abgleich mit Origin/Main...</p>
                </div>
              ) : updateStatus?.updateAvailable ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start bg-blue-900/10 border border-blue-800/40 p-4 rounded-lg">
                    <div className="mr-4 mt-1">
                      <div className="bg-blue-500 rounded-full h-3 w-3 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                    </div>
                    <div>
                      <h3 className="text-blue-400 font-medium">Update Verfügbar</h3>
                      <p className="text-sm text-gray-400 mt-1">Es wurden <strong className="text-white">{updateStatus.recentCommits?.length || 0} neue Commits</strong> auf dem Server gefunden.</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Betroffene Komponenten</h4>
                    <div className="flex flex-wrap gap-2">
                      {updateStatus.affectedComponents?.map((comp: string) => (
                        <span key={comp} className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 shadow-sm">
                          {comp}
                        </span>
                      ))}
                      {(!updateStatus.affectedComponents || updateStatus.affectedComponents.length === 0) && (
                        <span className="text-gray-600 italic text-sm">Keine ermittelbar</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Commit Historie</h4>
                    <div className="bg-gray-950 rounded-lg border border-gray-800 divide-y divide-gray-800 max-h-64 overflow-y-auto">
                      {updateStatus.recentCommits?.map((commit: any, i: number) => (
                        <div key={i} className="p-3.5 hover:bg-gray-900/50 transition-colors">
                          <p className="text-sm font-medium text-gray-200">{commit.subject}</p>
                          <p className="text-xs text-gray-500 mt-1.5 font-mono">{commit.date} • {commit.author}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-5 border-t border-gray-800">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={restartInstances}
                        onChange={(e) => setRestartInstances(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 bg-gray-950 transition-colors"
                      />
                      <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Laufende MetaTrader Instanzen bei Bedarf sofort neustarten</span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleExecuteUpdate}
                      disabled={isUpdating}
                      className="w-full bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center shadow-lg shadow-blue-500/20"
                    >
                      {isUpdating ? (
                        <><RefreshCw className="animate-spin mr-2" /> Installation läuft...</>
                      ) : (
                        "System Aktualisieren"
                      )}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
                      Das Update wird in einem separaten Hintergrundprozess ausgeführt.<br />Die Konsole lädt sich nach wenigen Sekunden neu.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <CheckCircle />
                  <h3 className="text-lg font-medium text-white mt-5">System ist auf dem neuesten Stand</h3>
                  <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">Ihre lokale Installation ist exakt synchronisiert mit dem produktiven Master Branch.</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
