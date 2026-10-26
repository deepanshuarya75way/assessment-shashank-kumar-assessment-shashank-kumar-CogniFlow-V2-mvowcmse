import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Code, Mail, Globe } from "lucide-react";

const GithubIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);


const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col">
      {/* Navbar */}
      <header className="h-16 px-6 border-b border-[var(--border)] bg-[var(--bg-panel)] flex items-center">
        <div className="max-w-[1040px] mx-auto w-full flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
          <div className="text-[15px] font-semibold text-[var(--text-primary)]">
            About CogniFlow
          </div>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-6 py-16 flex-1 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-4">
          <Code size={26} strokeWidth={1.75} />
        </div>

        <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight mb-2 text-center">
          About the Developer
        </h1>

        <p className="text-[15px] text-[var(--text-secondary)] text-center max-w-md mb-8 leading-relaxed">
          Hi, I'm Shashank Kumar. I built CogniFlow to explore calm, reliable real-time communication coupled with native document intelligence.
        </p>

        {/* Contact / Links Card */}
        <div className="w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-[14px] shadow-[var(--shadow-md)] p-6 flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-1 pb-2 border-b border-[var(--border)]">
            Connect
          </h2>

          <a
            href="mailto:shashankmuz3@gmail.com"
            className="flex items-center gap-3.5 p-3 rounded-[10px] hover:bg-[var(--bg-hover)] transition-colors border border-transparent hover:border-[var(--border)]"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0">
              <Mail size={18} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Email</span>
              <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">shashankmuz3@gmail.com</span>
            </div>
          </a>

          <a
            href="https://github.com/Shashank028R/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 p-3 rounded-[10px] hover:bg-[var(--bg-hover)] transition-colors border border-transparent hover:border-[var(--border)]"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0">
              <Github size={18} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">GitHub</span>
              <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">github.com/Shashank028R</span>
            </div>
          </a>

          <a
            href="https://www.linkedin.com/in/shashank-kumar-70742b292/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 p-3 rounded-[10px] hover:bg-[var(--bg-hover)] transition-colors border border-transparent hover:border-[var(--border)]"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0">
              <Linkedin size={18} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">LinkedIn</span>
              <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">Shashank Kumar</span>
            </div>
          </a>

          <a
            href="https://www.instagram.com/shashank__.kumar/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 p-3 rounded-[10px] hover:bg-[var(--bg-hover)] transition-colors border border-transparent hover:border-[var(--border)]"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0">
              <Instagram size={18} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Instagram</span>
              <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">@shashank__.kumar</span>
            </div>
          </a>
        </div>
      </main>

      <footer className="py-6 text-center text-[13px] text-[var(--text-tertiary)] border-t border-[var(--border)]">
        Built by Shashank Kumar
      </footer>
    </div>
  );
};

export default AboutPage;
