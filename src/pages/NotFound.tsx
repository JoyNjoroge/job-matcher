import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, FileSearch } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="nf-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .nf-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FAFAF8;
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .nf-blob1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%); top: -200px; right: -200px; filter: blur(40px); pointer-events: none; }
        .nf-blob2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%); bottom: -100px; left: -100px; filter: blur(40px); pointer-events: none; }

        .nf-content { position: relative; z-index: 1; text-align: center; max-width: 480px; }
        .nf-logo { display: flex; align-items: center; gap: 8px; justify-content: center; margin-bottom: 48px; }
        .nf-logo span { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.1rem; color: #0A0A0F; }

        .nf-number {
          font-family: 'Syne', sans-serif;
          font-size: clamp(7rem, 20vw, 11rem);
          font-weight: 800;
          letter-spacing: -0.05em;
          line-height: 0.9;
          margin-bottom: 8px;
          background: linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(124,58,237,0.15) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
        }
        .nf-number::after {
          content: '404';
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: inherit;
          font-weight: 800;
          letter-spacing: inherit;
          background: linear-gradient(135deg, #2563EB, #7C3AED);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          opacity: 0.12;
          filter: blur(2px);
        }

        .nf-title { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: #0A0A0F; letter-spacing: -0.02em; margin: 24px 0 10px; }
        .nf-sub { color: #6B7280; font-size: 15px; font-weight: 300; line-height: 1.7; margin: 0 0 36px; }

        .nf-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #2563EB;
          color: white;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 6px 20px rgba(37,99,235,0.3);
          border: none;
          cursor: pointer;
        }
        .nf-btn:hover { background: #1D4ED8; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(37,99,235,0.4); }
      `}</style>

      <div className="nf-blob1" />
      <div className="nf-blob2" />

      <div className="nf-content">
        <div className="nf-logo">
          <FileSearch size={22} color="#2563EB" />
          <span>ApplyBotPro</span>
        </div>

        <div className="nf-number">404</div>

        <h1 className="nf-title">Page Not Found</h1>
        <p className="nf-sub">
          The page you're looking for doesn't exist or may have been moved.
          Let's get you back on track.
        </p>

        <a href="/" className="nf-btn">
          <ArrowLeft size={16} /> Back to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
