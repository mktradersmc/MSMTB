"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, AlertCircle, Activity, ChevronRight, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Assume the backend runs on port 3005
            const res = await fetch("http://127.0.0.1:3005/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (data.success && data.token) {
                // Set token in cookies (accessible to middleware)
                document.cookie = `auth_token=${data.token}; path=/; max-age=604800; samesite=strict`;
                // Store in localStorage for socket
                localStorage.setItem("auth_token", data.token);
                // Redirect to dashboard
                router.push("/");
                router.refresh();
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-vh-100 min-h-screen bg-black font-sans selection:bg-[#2563EB]/40 selection:text-white overflow-hidden">

            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/bg-alt-1-widescreen.png"
                    alt="Trading Background"
                    fill
                    className="object-cover opacity-80"
                    priority
                    quality={100}
                />
            </div>

            {/* Simple Background Overlay to ensure contrast */}
            <div className="absolute inset-0 z-0 bg-[#05050A]/50 backdrop-blur-[1px] pointer-events-none" />

            {/* Subtler, Sharper, Smaller Login Box */}
            <div className="w-full max-w-[340px] p-7 bg-[#0B0D14]/85 border border-slate-800 rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.8)] backdrop-blur-xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Decorative Top Accent */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                <div className="text-center mb-8 flex flex-col items-center">
                    {/* Sleek Logo Area */}
                    <div className="w-12 h-12 mb-4 bg-[#05050A] border border-slate-800 flex items-center justify-center rounded-md shadow-inner relative">
                        <div className="absolute inset-0 bg-blue-500/10 blur-md rounded-md" />
                        <Activity className="text-blue-400 relative z-10" size={24} strokeWidth={1.5} />
                    </div>

                    <h1 className="text-xl font-bold tracking-tight text-white mb-1">
                        Awesome <span className="text-blue-400">Cockpit</span>
                    </h1>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span>Terminal Access</span>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 text-xs text-[#EF4444] bg-[#ef4444]/10 border border-[#ef4444]/20 p-2.5 rounded-sm animate-in fade-in zoom-in-95 duration-200">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Ident</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-600 group-focus-within/input:text-blue-400 transition-colors">
                                    <User size={16} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 bg-black/50 border border-slate-800 text-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-700 transition-all outline-none"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Access Key</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-600 group-focus-within/input:text-blue-400 transition-colors">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type="password"
                                    className="w-full pl-9 pr-3 py-2 bg-black/50 border border-slate-800 text-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-700 transition-all outline-none"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        {loading ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                Authenticate <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-[9px] text-slate-700 font-mono tracking-widest uppercase">
                        V 8.23.44 • Secure
                    </p>
                </div>
            </div>
        </div>
    );
}
