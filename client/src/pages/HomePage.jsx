import React from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MessageSquare,
  Bot,
  FileSearch,
  CheckCheck,
  MoreHorizontal,
  Paperclip,
  Check
} from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-panel)] text-[var(--text-primary)]">
      {/* Navbar (Height 64px, solid panel background, 1px bottom border, no blur) */}
      <header className="h-16 px-6 border-b border-[var(--border)] bg-[var(--bg-panel)] sticky top-0 z-30">
        <div className="max-w-[1040px] mx-auto h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 select-none">
            <img
              src="/images/CogniFlow.png"
              alt="CogniFlow"
              className="w-6 h-6 object-contain"
            />
            <span className="text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
              CogniFlow
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              to="/about"
              className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-normal"
            >
              About
            </Link>
            <button
              onClick={() => navigate("/auth")}
              className="h-9 px-4 rounded-[10px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[14px] font-semibold transition-colors cursor-pointer"
            >
              Log in
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-[1040px] mx-auto px-6 pt-16 pb-20">
        <div className="text-center max-w-[680px] mx-auto">
          <h1 className="text-[32px] sm:text-[48px] font-semibold text-[var(--text-primary)] leading-[1.12] tracking-[-0.02em] mb-4">
            Team chat with an assistant that reads your files.
          </h1>

          <p className="text-[16px] sm:text-[18px] text-[var(--text-secondary)] leading-[1.5] max-w-[560px] mx-auto mb-8 font-normal">
            Message your team in real time and ask CogniBot about any image or PDF, right inside the conversation.
          </p>

          <div className="flex items-center justify-center gap-3 mb-14">
            <button
              onClick={() => navigate("/auth")}
              className="h-11 px-6 rounded-[10px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[15px] font-semibold transition-colors cursor-pointer"
            >
              Get started
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="h-11 px-6 rounded-[10px] border border-[var(--border-strong)] bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[15px] font-medium transition-colors cursor-pointer"
            >
              Log in
            </button>
          </div>
        </div>

        {/* Product Mock Container (§4.1 static light-theme WhatsApp layout mock) */}
        <div className="rounded-[12px] border border-[var(--border)] shadow-[var(--shadow-md)] overflow-hidden bg-[var(--bg-app)] mb-24 max-w-[940px] mx-auto">
          {/* Mock Window Bar */}
          <div className="h-10 px-4 bg-[var(--bg-panel)] border-b border-[var(--border)] flex items-center gap-2 select-none">
            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[12px] text-[var(--text-tertiary)] mx-auto font-mono">CogniFlow for Web</span>
          </div>

          {/* Mock App Body */}
          <div className="flex h-[420px] select-none">
            {/* Mock Left Sidebar */}
            <div className="w-[300px] border-r border-[var(--border)] bg-[var(--bg-panel)] hidden sm:flex flex-col">
              <div className="h-[60px] px-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="w-9 h-9 rounded-full bg-[#5B7083] text-white flex items-center justify-center font-semibold text-xs">
                  S
                </div>
                <div className="flex gap-2 text-[var(--text-tertiary)]">
                  <div className="w-7 h-7 rounded-full bg-[var(--bg-hover)]" />
                  <div className="w-7 h-7 rounded-full bg-[var(--bg-hover)]" />
                </div>
              </div>

              <div className="p-2 border-b border-[var(--border)]">
                <div className="h-8 rounded-[8px] bg-[var(--bg-input)] px-3 text-[12px] text-[var(--text-tertiary)] flex items-center">
                  Search or start a new chat
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center h-[64px] px-3 bg-[var(--bg-selected)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] mr-3 flex items-center justify-center p-1.5 border border-[var(--border)]">
                    <img src="/images/CogniFlow.png" alt="CogniBot" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[14px] font-medium text-[var(--text-primary)]">CogniBot</span>
                      <span className="text-[11px] text-[var(--text-tertiary)]">12:45 PM</span>
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)] truncate">Summarized Q3_Report.pdf in 4 points</p>
                  </div>
                </div>

                <div className="flex items-center h-[64px] px-3 hover:bg-[var(--bg-hover)]">
                  <div className="w-10 h-10 rounded-full bg-[#546E7A] text-white mr-3 flex items-center justify-center font-semibold text-xs">
                    P
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[14px] font-medium text-[var(--text-primary)]">Product Engineering</span>
                      <span className="text-[11px] text-[var(--accent)] font-medium">11:20 AM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[12px] text-[var(--text-secondary)] truncate">Check out the newly uploaded docs</p>
                      <span className="w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[10px] font-semibold flex items-center justify-center">2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Chat View */}
            <div className="flex-1 flex flex-col bg-[var(--bg-chat)]">
              {/* Header */}
              <div className="h-[60px] px-4 bg-[var(--bg-panel)] border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center p-1.5">
                    <img src="/images/CogniFlow.png" alt="CogniBot" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-[var(--text-primary)] leading-tight">CogniBot</h4>
                    <span className="text-[12px] text-[var(--text-secondary)]">online</span>
                  </div>
                </div>
                <div className="h-7 px-2.5 rounded-[6px] border border-[var(--border-strong)] text-[12px] text-[var(--text-primary)] flex items-center gap-1">
                  <span>Quiz Me</span>
                </div>
              </div>

              {/* Chat bubbles */}
              <div className="flex-1 p-4 flex flex-col gap-2 overflow-hidden justify-end">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bubble-tail-out rounded-[8px] bg-[var(--bubble-out)] text-[var(--bubble-out-text)] p-2.5 px-3 max-w-[80%] text-[13px] leading-relaxed">
                    <span>@cogni summarize the quarterly report and highlight key risks</span>
                    <div className="flex justify-end items-center gap-1 text-[10px] text-[var(--text-tertiary)] mt-1">
                      <span>12:44 PM</span>
                      <CheckCheck size={14} className="text-[var(--tick-seen)]" />
                    </div>
                  </div>
                </div>

                {/* CogniBot reply */}
                <div className="flex justify-start">
                  <div className="bubble-tail-in rounded-[8px] bg-[var(--bubble-in)] text-[var(--bubble-in-text)] shadow-[var(--shadow-sm)] p-2.5 px-3 max-w-[85%] text-[13px] leading-relaxed">
                    <span className="text-[11px] font-medium text-[var(--accent)] block mb-1">CogniBot</span>
                    <p className="mb-1.5">Here is the executive summary from <strong>Q3_Report.pdf</strong>:</p>
                    <ul className="list-disc pl-4 space-y-0.5 mb-1.5 text-[12.5px]">
                      <li>Revenue grew 18% YoY driven by enterprise adoption</li>
                      <li>Operating margins improved by 240 bps</li>
                      <li>Key risk: Supply chain lead times expanded into Q4</li>
                    </ul>
                    <div className="pt-1.5 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
                      <span>Sources: 1 · Q3_Report.pdf · p.4</span>
                    </div>
                    <div className="flex justify-end text-[10px] text-[var(--text-tertiary)] mt-1">
                      <span>12:45 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Input Bar */}
              <div className="h-[56px] px-4 bg-[var(--bg-input)] border-t border-[var(--border)] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)]">
                  <Paperclip size={18} />
                </div>
                <div className="flex-1 h-9 rounded-full bg-[var(--bg-panel)] px-4 flex items-center text-[13px] text-[var(--text-tertiary)]">
                  Type a message
                </div>
                <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                  <Check size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section (§4.1 3x2 grid of flat borderless items) */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-[24px] sm:text-[28px] font-semibold text-[var(--text-primary)] tracking-tight mb-2">
              Everything you need to collaborate
            </h2>
            <p className="text-[14px] text-[var(--text-secondary)] max-w-md mx-auto">
              Simple, reliable messaging built around modern document intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-[12px] border border-[var(--border)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors">
              <div className="text-[var(--accent)] mb-3">
                <MessageSquare size={20} strokeWidth={1.75} />
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1.5">
                Real-time messaging
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                Group rooms and one-to-one chats that update instantly across all your devices.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-[12px] border border-[var(--border)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors">
              <div className="text-[var(--accent)] mb-3">
                <Bot size={20} strokeWidth={1.75} />
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1.5">
                CogniBot in any chat
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                Type @cogni to ask the assistant a question directly in the room for all members to see.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-[12px] border border-[var(--border)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors">
              <div className="text-[var(--accent)] mb-3">
                <FileSearch size={20} strokeWidth={1.75} />
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1.5">
                Image and PDF understanding
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                Upload a file and ask CogniBot to describe, summarize, or cross-reference it with verified citations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-[12px] border border-[var(--border)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors">
              <div className="text-[var(--accent)] mb-3">
                <CheckCheck size={20} strokeWidth={1.75} />
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1.5">
                Read receipts
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                See exactly when a message is sent, delivered, and seen with familiar checkmarks.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-[12px] border border-[var(--border)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors">
              <div className="text-[var(--accent)] mb-3">
                <MoreHorizontal size={20} strokeWidth={1.75} />
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1.5">
                Typing indicators
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                Know when teammates or CogniBot are active and actively typing a reply.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-[12px] border border-[var(--border)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors">
              <div className="text-[var(--accent)] mb-3">
                <Paperclip size={20} strokeWidth={1.75} />
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1.5">
                Attachments
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                Share images, PDFs, and documents with clean inline previews before sending.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-6 bg-[var(--bg-panel)]">
        <div className="max-w-[1040px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[var(--text-secondary)]">
          <div>
            <span>CogniFlow · Team Chat & Document Intelligence</span>
          </div>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-[var(--text-primary)] transition-colors">
              About
            </Link>
            <Link to="/auth" className="hover:text-[var(--text-primary)] transition-colors">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
