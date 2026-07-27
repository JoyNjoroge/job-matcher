/**
 * Layout.tsx — Production-ready sidebar layout
 * Fixes:
 *  1. Collapse toggle always visible (floats outside sidebar when collapsed)
 *  2. Dark mode unified — writes both data-theme AND class so next-themes + CSS vars both work
 *  3. Sidebar auto-collapses on scroll down, expands on scroll up (desktop only)
 */
import { useState, useEffect, useRef, createContext, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileSearch, Search, LayoutGrid, Send, ClipboardList,
  MessageSquare, User, FileText, CreditCard, ChevronLeft,
  ChevronRight, Menu, X, LogOut, Sun, Moon, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ── Theme context ─────────────────────────────────────────────────── */
const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

/* ── Sidebar context ───────────────────────────────────────────────── */
const SidebarCtx = createContext<{ collapsed: boolean; toggle: () => void }>({ collapsed: false, toggle: () => {} });

/* ── Nav items ─────────────────────────────────────────────────────── */
const NAV = [
  { icon: FileSearch,    label: "Analyze",       path: "/analyze"       },
  { icon: Search,        label: "Job Search",     path: "/search"        },
  { icon: LayoutGrid,    label: "Board",          path: "/board"         },
  { icon: ClipboardList, label: "Applications",   path: "/applications"  },
  { icon: MessageSquare, label: "Interview Prep", path: "/prep"          },
  { icon: Send,          label: "Apply",          path: "/apply-briefing"},
  { icon: FileText,      label: "CV Generator",   path: "/cv-generator"  },
];

const NAV_BOTTOM = [
  { icon: User,       label: "Profile",  path: "/profile"  },
  { icon: CreditCard, label: "Pricing",  path: "/pricing"  },
];

/* ── CSS ────────────────────────────────────────────────────────────── */
const CSS = `

  :root {
    --sidebar-w: 240px;
    --sidebar-collapsed-w: 64px;
    --header-h: 0px;
    --bg: #F7F6F1;
    --surface: #FFFFFF;
    --surface2: #F0F0EA;
    --border: rgba(0,0,0,0.07);
    --text: #0A0A0F;
    --text2: #6B7280;
    --text3: #9CA3AF;
    --accent: #245C46;
    --accent-hover: #193F31;
    --accent-bg: rgba(36,92,70,0.08);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
    --radius: 8px;
    --transition: 0.22s cubic-bezier(0.4,0,0.2,1);
  }

  /* Dark mode — written on BOTH html[data-theme=dark] AND html.dark
     so CSS vars AND Tailwind dark: classes both work */
  [data-theme="dark"], .dark {
    --bg: #0F0F12;
    --surface: #1A1A20;
    --surface2: #22222A;
    --border: rgba(255,255,255,0.07);
    --text: #F1F1F3;
    --text2: #9CA3AF;
    --text3: #6B7280;
    --accent: #74B697;
    --accent-hover: #91C7AC;
    --accent-bg: rgba(116,182,151,0.12);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; }
  body { background: var(--bg); color: var(--text); font-family: var(--font-ui); }

  /* ── SIDEBAR ── */
  .sb-sidebar {
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    transition: width var(--transition), transform var(--transition);
    overflow: hidden;
  }
  .sb-sidebar.collapsed { width: var(--sidebar-collapsed-w); }

  /* Mobile: off-canvas */
  @media (max-width: 767px) {
    .sb-sidebar { transform: translateX(-100%); width: var(--sidebar-w) !important; }
    .sb-sidebar.mobile-open { transform: translateX(0); box-shadow: var(--shadow-lg); }
  }

  /* Overlay */
  .sb-overlay {
    display: none; position: fixed; inset: 0; z-index: 99;
    background: rgba(0,0,0,0.4); backdrop-filter: blur(2px);
    animation: overlayIn 0.2s ease;
  }
  .sb-overlay.visible { display: block; }
  @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

  /* Logo area */
  .sb-logo {
    height: 64px; display: flex; align-items: center;
    padding: 0 16px; gap: 10px; flex-shrink: 0;
    border-bottom: 1px solid var(--border);
    overflow: hidden;
  }
  .sb-logo-mark {
    width: 34px; height: 34px; border-radius: 50%; background: transparent;
    border: 1px solid var(--text);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: none;
  }
  .sb-logo-name {
    font-family: var(--font-ui); font-weight: 700; font-size: 0.95rem;
    color: var(--text); letter-spacing: -0.01em; white-space: nowrap;
    opacity: 1; transition: opacity var(--transition);
    flex: 1;
  }
  .collapsed .sb-logo-name { opacity: 0; pointer-events: none; }

  /* ── COLLAPSE TOGGLE — always visible ──
     When expanded: sits inside sidebar logo row (inline).
     When collapsed: floats as a pill just outside the sidebar edge. */
  .sb-toggle {
    position: relative;
    width: 28px; height: 28px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--surface2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text2); transition: all 0.2s; flex-shrink: 0;
    z-index: 101;
  }
  .sb-toggle:hover { background: var(--accent-bg); color: var(--accent); }

  /* When collapsed, float the toggle button outside the sidebar */
  .sb-sidebar.collapsed .sb-toggle {
    position: fixed;
    left: calc(var(--sidebar-collapsed-w) - 14px);
    top: 20px;
    width: 28px; height: 28px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 50%;
    box-shadow: var(--shadow-md);
  }
  .sb-sidebar.collapsed .sb-toggle:hover {
    background: var(--accent); color: white; border-color: var(--accent);
  }

  /* Hide toggle on mobile */
  @media (max-width: 767px) { .sb-toggle { display: none; } }

  /* Nav section */
  .sb-nav { flex: 1; padding: 12px 8px; overflow-y: auto; overflow-x: hidden; }
  .sb-nav::-webkit-scrollbar { width: 4px; }
  .sb-nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .sb-nav-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text3);
    padding: 8px 10px 4px;
    white-space: nowrap; overflow: hidden;
    transition: opacity var(--transition);
  }
  .collapsed .sb-nav-label { opacity: 0; }

  .sb-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 9px;
    color: var(--text2); cursor: pointer; text-decoration: none;
    font-size: 13.5px; font-weight: 500; white-space: nowrap;
    transition: all 0.15s; position: relative; overflow: hidden;
    margin-bottom: 2px;
  }
  .sb-nav-item:hover { background: var(--surface2); color: var(--text); }
  .sb-nav-item.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .sb-nav-item .nav-icon { flex-shrink: 0; width: 18px; }
  .sb-nav-item .nav-label {
    opacity: 1; transition: opacity var(--transition);
    overflow: hidden; white-space: nowrap;
  }
  .collapsed .sb-nav-item .nav-label { opacity: 0; }

  /* Tooltip for collapsed state */
  .sb-nav-item .sb-tooltip {
    display: none; position: absolute; left: calc(100% + 12px); top: 50%;
    transform: translateY(-50%); background: var(--text); color: var(--bg);
    font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 7px;
    white-space: nowrap; pointer-events: none; z-index: 200;
    box-shadow: var(--shadow-md);
  }
  .collapsed .sb-nav-item:hover .sb-tooltip { display: block; }

  /* Bottom area */
  .sb-bottom {
    border-top: 1px solid var(--border);
    padding: 8px;
    display: flex; flex-direction: column; gap: 2px;
  }

  .sb-user {
    display: flex; align-items: center; gap: 9px;
    padding: 8px 10px; border-radius: 9px;
    color: var(--text2); cursor: default;
    font-size: 13px; overflow: hidden;
  }
  .sb-user-av {
    width: 28px; height: 28px; border-radius: 7px;
    background: var(--accent-bg); color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
    border: 1px solid var(--accent-bg);
  }
  .sb-user-email {
    font-size: 12px; color: var(--text2); overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; flex: 1;
    transition: opacity var(--transition);
  }
  .collapsed .sb-user-email { opacity: 0; }

  .sb-actions-row {
    display: flex; gap: 4px;
  }
  .sb-action-btn {
    flex: 1; height: 34px; border: none; border-radius: 8px;
    background: var(--surface2); color: var(--text2);
    display: flex; align-items: center; justify-content: center; gap: 5px;
    cursor: pointer; font-size: 12px; font-weight: 600; font-family: inherit;
    transition: all 0.15s; white-space: nowrap; overflow: hidden;
  }
  .sb-action-btn:hover { background: var(--accent-bg); color: var(--accent); }
  .sb-action-btn.danger:hover { background: rgba(239,68,68,0.1); color: #EF4444; }
  .collapsed .sb-action-btn span { display: none; }

  /* ── MAIN ── */
  .sb-main {
    margin-left: var(--sidebar-w);
    min-height: 100vh;
    transition: margin-left var(--transition);
    background: var(--bg);
  }
  .sb-main.collapsed { margin-left: var(--sidebar-collapsed-w); }
  @media (max-width: 767px) { .sb-main { margin-left: 0 !important; } }

  /* Mobile top bar */
  .sb-mobile-bar {
    display: none; position: sticky; top: 0; z-index: 50;
    height: 56px; background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 16px; align-items: center; justify-content: space-between;
    box-shadow: var(--shadow-sm);
  }
  @media (max-width: 767px) { .sb-mobile-bar { display: flex; } }

  .sb-mobile-menu-btn {
    width: 36px; height: 36px; border-radius: 9px;
    border: 1px solid var(--border); background: var(--surface2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text); transition: all 0.15s;
  }
  .sb-mobile-menu-btn:hover { background: var(--accent-bg); color: var(--accent); }

  .sb-mobile-logo {
    display: flex; align-items: center; gap: 8px; font-family: var(--font-ui);
    font-weight: 700; font-size: 0.9rem; color: var(--text);
  }

  /* ── CONTENT ── */
  .sb-content { padding: 28px 32px 80px; max-width: 1200px; }
  @media (max-width: 1024px) { .sb-content { padding: 24px 20px 60px; } }
  @media (max-width: 640px) { .sb-content { padding: 16px 14px 60px; } }

  /* ── PLAN BADGE ── */
  .sb-plan-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
    letter-spacing: 0.02em; text-transform: uppercase;
    background: var(--accent-bg); color: var(--accent);
    transition: opacity var(--transition); white-space: nowrap;
  }
  .collapsed .sb-plan-badge { opacity: 0; }

  /* ── Scroll-collapse animation hint ── */
  .sb-sidebar {
    will-change: width;
  }
`;

/* ── Component ─────────────────────────────────────────────────────── */
export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, plan } = useAuth();

  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("theme") === "dark"; } catch { return false; }
  });
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebarCollapsed") === "true"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Track last scroll Y for scroll-collapse behaviour
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── FIX 2: Unified dark mode ──────────────────────────────────────
  // Write BOTH data-theme (for CSS vars) AND class (for Tailwind/next-themes)
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark");
    } else {
      root.setAttribute("data-theme", "light");
      root.classList.remove("dark");
    }
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);

  // ── FIX 3: Scroll-to-collapse (desktop only) ──────────────────────
  useEffect(() => {
    const isMobile = () => window.innerWidth <= 767;

    const onScroll = () => {
      if (isMobile()) return;
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      // Scrolling DOWN > 60px → collapse
      if (delta > 60 && !collapsed) {
        setCollapsed(true);
      }
      // Scrolling UP > 40px → expand
      else if (delta < -40 && collapsed) {
        setCollapsed(false);
      }

      // Debounce update so small jitter doesn't flip repeatedly
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        lastScrollY.current = currentY;
      }, 50);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [collapsed]);

  // Save collapsed state
  useEffect(() => {
    try { localStorage.setItem("sidebarCollapsed", String(collapsed)); } catch {}
  }, [collapsed]);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const initials = user?.email?.substring(0, 2).toUpperCase() || "?";
  const emailDisplay = user?.email || "";
  const planLabel = plan || "free";

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try { await logout(); } catch {}
    navigate("/login");
  };

  const toggleCollapsed = () => setCollapsed(c => !c);

  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      <SidebarCtx.Provider value={{ collapsed, toggle: toggleCollapsed }}>
        <style>{CSS}</style>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="sb-overlay visible" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`sb-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>

          {/* Logo + collapse toggle */}
          <div className="sb-logo">
            <div className="sb-logo-mark">
              <FileSearch size={16} color="currentColor" />
            </div>
            <span className="sb-logo-name">CandorApply</span>

            {/* ── FIX 1: Toggle always rendered.
                When collapsed, CSS positions it as a floating pill outside the sidebar.
                ChevronLeft = expanded state (click to collapse)
                ChevronRight = collapsed state (click to expand) */}
            <button
              className="sb-toggle"
              onClick={toggleCollapsed}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Main nav */}
          <nav className="sb-nav">
            <div className="sb-nav-label">Main</div>
            {NAV.map(({ icon: Icon, label, path }) => (
              <div
                key={path}
                className={`sb-nav-item ${location.pathname === path ? "active" : ""}`}
                onClick={() => handleNav(path)}
              >
                <Icon size={17} className="nav-icon" />
                <span className="nav-label">{label}</span>
                <span className="sb-tooltip">{label}</span>
              </div>
            ))}

            <div className="sb-nav-label" style={{ marginTop: 12 }}>Account</div>
            {NAV_BOTTOM.map(({ icon: Icon, label, path }) => (
              <div
                key={path}
                className={`sb-nav-item ${location.pathname === path ? "active" : ""}`}
                onClick={() => handleNav(path)}
              >
                <Icon size={17} className="nav-icon" />
                <span className="nav-label">{label}</span>
                <span className="sb-tooltip">{label}</span>
              </div>
            ))}
          </nav>

          {/* Bottom: user + actions */}
          <div className="sb-bottom">
            {/* Plan badge */}
            <div style={{ padding: "0 4px 6px" }}>
              <div className="sb-plan-badge">
                <ShieldCheck size={10} />
                {planLabel}
              </div>
            </div>

            <div className="sb-user">
              <div className="sb-user-av">{initials}</div>
              <span className="sb-user-email">{emailDisplay}</span>
            </div>

            <div className="sb-actions-row">
              <button className="sb-action-btn" onClick={() => setDark(d => !d)} title="Toggle theme">
                {dark ? <Sun size={14} /> : <Moon size={14} />}
                <span>{dark ? "Light" : "Dark"}</span>
              </button>
              <button className="sb-action-btn danger" onClick={handleLogout} title="Sign out">
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className={`sb-main ${collapsed ? "collapsed" : ""}`}>
          {/* Mobile top bar */}
          <div className="sb-mobile-bar">
            <button className="sb-mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="sb-mobile-logo">
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileSearch size={13} color="white" />
              </div>
              CandorApply
            </div>
            <button className="sb-action-btn" style={{ width: 36, height: 36, flex: "none" }} onClick={() => setDark(d => !d)}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          {/* Page content */}
          <div className="sb-content">
            {children}
          </div>
        </main>
      </SidebarCtx.Provider>
    </ThemeCtx.Provider>
  );
}
