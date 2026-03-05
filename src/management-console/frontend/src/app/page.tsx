"use client";

import React, { useState, useEffect } from "react";

// Icons
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" /><path d="m21 2-9.6 9.6" /><circle cx="7.5" cy="15.5" r="5.5" /></svg>;
const RefreshCw = ({ className = "" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>;
const CheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>;
const ShieldCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 7-3s5 2 7 3a1 1 0 0 1 1 1v7z" /><path d="m9 12 2 2 4-4" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const UpdateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>;

export default function ManagementConsole() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<"updates" | "settings" | "ssl">("updates");

  const [updateStatus, setUpdateStatus] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{ step: number, text: string, total?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [restartInstances, setRestartInstances] = useState(false);
  const [sysMesg, setSysMesg] = useState("");

  const [sysConfig, setSysConfig] = useState<any>(null);
  const [configUsername, setConfigUsername] = useState("");
  const [configPassword, setConfigPassword] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configMesg, setConfigMesg] = useState("");

  const [sslDomain, setSslDomain] = useState("");
  const [sslEmail, setSslEmail] = useState("");
  const [isGeneratingSsl, setIsGeneratingSsl] = useState(false);
  const [sslProgress, setSslProgress] = useState<{ step: number, text: string, total?: number } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mc_token");
    if (stored) {
      setToken(stored);
      fetchUpdateDetails(stored);
      fetchSystemConfig(stored);
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
        fetchSystemConfig(data.token);
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

  const fetchSystemConfig = async (authToken: string) => {
    try {
      const res = await fetch("/api/system/config", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success && data.config) {
        setSysConfig(data.config);
        setConfigUsername(data.config.systemUsername || "");
        setConfigPassword(data.config.systemPassword || "");

        if (data.config.projectRoot) {
          // Attempt to guess domain if it's set anywhere or just leave empty
        }
      }
    } catch (err) {
      console.error("Failed to load generic system config", err);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setConfigMesg("");
    try {
      const res = await fetch("/api/system/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ systemUsername: configUsername, systemPassword: configPassword })
      });
      const data = await res.json();
      if (data.success) {
        setConfigMesg("Einstellungen erfolgreich gespeichert!");
        fetchSystemConfig(token!);
      } else {
        setConfigMesg("Fehler beim Speichern der Konfiguration: " + data.error);
      }
    } catch (err) {
      setConfigMesg("Netzwerkfehler beim Speichern der Konfiguration.");
    }
    setIsSavingConfig(false);
  };

  const handleExecuteUpdate = async () => {
    if (!confirm("Sollen die Updates jetzt installiert werden? Das System wird für einige Sekunden nicht erreichbar sein.")) return;

    setIsUpdating(true);
    setUpdateProgress({ step: 1, text: "Initialisiere Update-Prozess..." });
    setSysMesg("Update-Prozess wurde gestartet! Bitte warten Sie den Vorgang ab...");

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
      if (!data.success) {
        setSysMesg("Fehler beim Starten des Updates: " + data.error);
        setIsUpdating(false);
      }
    } catch (err) {
      setSysMesg("Netzwerkfehler beim Update-Start.");
      setIsUpdating(false);
    }
  };

  const handleGenerateSsl = async () => {
    if (!sslDomain || !sslEmail) {
      alert("Bitte Domain und E-Mail Adresse eingeben.");
      return;
    }
    if (!confirm(`Soll jetzt ein Let's Encrypt Zertifikat für ${sslDomain} angefordert werden?\nPort 80 muss für diese Erneuerung freigeschaltet sein. Das System wird kurzzeitig neustarten.`)) return;

    setIsGeneratingSsl(true);
    setSslProgress({ step: 1, text: "Initialisiere Let's Encrypt Client...", total: 6 });
    setSysMesg("SSL-Generierung gestartet! Bitte warten Sie...");

    try {
      const res = await fetch("/api/system/ssl/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ domain: sslDomain, email: sslEmail })
      });
      const data = await res.json();
      if (!data.success) {
        setSysMesg("Fehler beim Starten der SSL Generierung: " + data.error);
        setIsGeneratingSsl(false);
      }
    } catch (err) {
      setSysMesg("Netzwerkfehler beim SSL-Start.");
      setIsGeneratingSsl(false);
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUpdating) {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/system/update/progress?t=" + Date.now(), { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setUpdateProgress(data);

            if (data.step === data.total || data.step === -1) {
              clearInterval(interval);
              setSysMesg(data.step === data.total ? "Update erfolgreich abgeschlossen!" : "Update fehlgeschlagen. System-Rollback aktiv.");
              setTimeout(() => {
                setIsUpdating(false);
                window.location.reload();
              }, 3000);
            }
          }
        } catch (e) {
          console.log("Waiting for backend during PM2 restart...");
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isUpdating]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGeneratingSsl) {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/system/ssl/progress?t=" + Date.now(), { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setSslProgress(data);

            if (data.step === (data.total || 6) || data.step === -1) {
              clearInterval(interval);
              setSysMesg(data.step === (data.total || 6) ? "Zertifikat erfolgreich installiert!" : "Fehler bei der SSL Generierung.");
              setTimeout(() => {
                setIsGeneratingSsl(false);
                window.location.reload();
              }, 5000);
            }
          }
        } catch (e) {
          console.log("Waiting for backend during PM2 SSL restart...");
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isGeneratingSsl]);

  useEffect(() => {
    if (!token || isUpdating || isGeneratingSsl) return;
    const checkUpdates = async () => {
      try {
        const res = await fetch("/api/system/update/status");
        if (res.ok) {
          const data = await res.json();
          if (data.updateAvailable && (!updateStatus?.commits || updateStatus.commits.length === 0)) {
            fetchUpdateDetails(token);
          }
        }
      } catch (e) {
        console.error("Failed to check background update status", e);
      }
    };
    const intervalId = setInterval(checkUpdates, 10000);
    return () => clearInterval(intervalId);
  }, [token, isUpdating, isGeneratingSsl, updateStatus?.commits?.length]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("mc_token");
    setUpdateStatus(null);
    setSysConfig(null);
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
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-white focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Passwort</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-white focus:outline-none focus:border-blue-500" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded transition-colors mt-4 shadow-lg shadow-blue-500/20">Anmelden</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col md:flex-row">
      {/* Loading Overlay for Updates or SSL */}
      {(isUpdating || isGeneratingSsl) && (
        <div className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {isUpdating ? "System Update Läuft" : "SSL Zertifikat wird generiert"}
            </h2>
            <p className="text-gray-400 text-sm text-center mb-8">
              {isUpdating ? "Das System wird aktualisiert." : "Das Let's Encrypt Zertifikat wird verifiziert und installiert."} Bitte schließen Sie diese Seite nicht.
            </p>

            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-400">Fortschritt</span>
              <span className="text-xs font-mono bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                Schritt {Math.max(1, (isUpdating ? updateProgress?.step : sslProgress?.step) || 1)} / {(isUpdating ? updateProgress?.total : sslProgress?.total) || 9}
              </span>
            </div>

            <div className="w-full bg-gray-950 rounded-full h-3 mb-6 border border-gray-800 overflow-hidden shadow-Inner">
              <div
                className={`h-3 rounded-full transition-all duration-500 ease-out ${((isUpdating ? updateProgress?.step : sslProgress?.step) === -1) ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                style={{ width: `${Math.max(5, (Math.max(1, (isUpdating ? updateProgress?.step : sslProgress?.step) || 1) / ((isUpdating ? updateProgress?.total : sslProgress?.total) || 9)) * 100)}%` }}
              />
            </div>

            <div className="bg-black/60 p-4 rounded-lg border border-gray-800 flex items-start">
              <RefreshCw className="animate-spin text-blue-500 mr-3 shrink-0 mt-0.5" />
              <p className="text-sm font-mono text-gray-300 leading-relaxed break-words">
                {(isUpdating ? updateProgress?.text : sslProgress?.text) || "Verbinde mit Log..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 md:h-screen sticky top-0 md:flex flex-col">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between md:justify-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <KeyIcon /> Konsole
            </h1>
            <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-semibold">System Manager</p>
          </div>
        </div>

        <nav className="flex-1 p-4 flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          <button
            onClick={() => setActiveTab("updates")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal ${activeTab === 'updates' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <UpdateIcon /> Release Updates
          </button>
          <button
            onClick={() => setActiveTab("ssl")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal ${activeTab === 'ssl' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <ShieldCheck /> SSL / Let's Encrypt
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal ${activeTab === 'settings' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <SettingsIcon /> System Parameter
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800 md:block hidden">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 w-full text-left rounded-lg text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <LogOutIcon /> Abmelden
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-h-screen overflow-auto">
        {sysMesg && (
          <div className="max-w-4xl mx-auto mb-6 bg-blue-900/20 border border-blue-800 text-blue-300 p-4 rounded-lg shadow-Inner animate-in fade-in zoom-in-95">
            {sysMesg}
            <button className="float-right text-blue-400 hover:text-blue-300" onClick={() => setSysMesg("")}>×</button>
          </div>
        )}

        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* 1. UPDATES TAB */}
          {activeTab === 'updates' && (
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
                ) : (updateStatus?.commits?.length > 0) ? (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-start bg-blue-900/10 border border-blue-800/40 p-4 rounded-lg">
                      <div className="mr-4 mt-1">
                        <div className="bg-blue-500 rounded-full h-3 w-3 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                      </div>
                      <div>
                        <h3 className="text-blue-400 font-medium">Update Verfügbar</h3>
                        <p className="text-sm text-gray-400 mt-1">Es wurden <strong className="text-white">{updateStatus.commits.length} neue Commits</strong> gefunden.</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Betroffene Komponenten</h4>
                      <div className="flex flex-wrap gap-2">
                        {updateStatus.components && Object.entries(updateStatus.components)
                          .filter(([_, isAffected]) => isAffected)
                          .map(([comp, _]) => (
                            <span key={comp} className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 shadow-sm capitalize">
                              {comp === 'ninjatrader' ? 'NinjaTrader' : comp === 'metatrader' ? 'MetaTrader' : comp}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Commit Historie</h4>
                      <div className="bg-gray-950 rounded-lg border border-gray-800 divide-y divide-gray-800 max-h-64 overflow-y-auto">
                        {updateStatus.commits?.map((commit: any, i: number) => (
                          <div key={i} className="p-3.5 hover:bg-gray-900/50 transition-colors">
                            <p className="text-sm font-medium text-gray-200">{commit.message}</p>
                            <p className="text-xs text-gray-500 mt-1.5 font-mono">{commit.hash}</p>
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
                        className="w-full bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-900 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        System Aktualisieren
                      </button>
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
          )}

          {/* 2. SSL TAB */}
          {activeTab === 'ssl' && (
            <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 backdrop-blur">
                <div>
                  <h2 className="text-lg font-semibold text-white">SSL Zertifikate</h2>
                  <p className="text-xs text-gray-400 mt-1">Automatisierte Ausstellung via Let's Encrypt</p>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-4 mb-6">
                  <h3 className="text-yellow-500 text-sm font-semibold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                    Wichtiger Hinweis
                  </h3>
                  <p className="text-xs text-yellow-200/70 leading-relaxed">
                    Um ein Let's Encrypt Zertifikat zu generieren, muss der <strong>Port 80 TCP</strong> aus dem Internet auf diesen Server weitergeleitet und erreichbar sein. Andernfalls schlägt die automatische Validierung fehl.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Öffentlicher Domain Name</label>
                    <input
                      type="text"
                      placeholder="z.B. backend.meinedomain.de"
                      value={sslDomain}
                      onChange={(e) => setSslDomain(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">E-Mail für Zertifikats-Warnungen</label>
                    <input
                      type="email"
                      placeholder="z.B. admin@meinedomain.de"
                      value={sslEmail}
                      onChange={(e) => setSslEmail(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                    />
                  </div>

                  <div className="pt-4 mt-2 border-t border-gray-800">
                    <button
                      onClick={handleGenerateSsl}
                      disabled={isGeneratingSsl || !sslDomain || !sslEmail}
                      className="bg-green-600 hover:bg-green-500 focus:ring-4 focus:ring-green-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all shadow-lg shadow-green-500/20 text-sm flex items-center justify-center w-full md:w-auto"
                    >
                      {isGeneratingSsl ? "Wird verarbeitet..." : "Zertifikat Anfordern & Installieren"}
                    </button>
                    <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                      Die Validierung und Generierung kann 10-20 Sekunden in Anspruch nehmen. Alle Backend-Dienste werden im Anschluss automatisch neu gestartet.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 backdrop-blur">
                <div>
                  <h2 className="text-lg font-semibold text-white">System Parameter</h2>
                  <p className="text-xs text-gray-400 mt-1">Globale Konfiguration des Backends</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {configMesg && (
                  <div className={`p-3 rounded text-sm ${configMesg.includes('Fehler') || configMesg.includes('Netzwerk') ? 'bg-red-900/20 text-red-400 border border-red-800' : 'bg-green-900/20 text-green-400 border border-green-800'}`}>
                    {configMesg}
                  </div>
                )}

                {sysConfig ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Installationspfad (Basis)</label>
                      <input
                        type="text"
                        value={sysConfig.projectRoot || 'Unbekannt'}
                        readOnly
                        className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-gray-400 cursor-not-allowed font-mono text-sm"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">System-Benutzername</label>
                        <input
                          type="text"
                          value={configUsername}
                          onChange={(e) => setConfigUsername(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">System-Passwort</label>
                        <input
                          type="password"
                          value={configPassword}
                          onChange={(e) => setConfigPassword(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-800 flex justify-end">
                      <button
                        onClick={handleSaveConfig}
                        disabled={isSavingConfig || (configUsername === sysConfig?.systemUsername && configPassword === sysConfig?.systemPassword)}
                        className="bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-all shadow-lg shadow-blue-500/20 text-sm flex items-center"
                      >
                        {isSavingConfig ? "Wird gespeichert..." : "Konfiguration Speichern"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                    Konfiguration wird geladen...
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
