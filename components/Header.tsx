'use client';

import React from 'react';
import { Sparkles, CheckCircle2, XCircle, Lock, LayoutDashboard, LogOut } from 'lucide-react';

interface HeaderProps {
  preOpen: boolean;
  postOpen: boolean;
  onOpenAdminModal: () => void;
  isAdminLoggedIn: boolean;
  onToggleAdminView: () => void;
  onLogoutAdmin?: () => void;
  activeView: 'home' | 'quiz' | 'result' | 'admin';
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  preOpen,
  postOpen,
  onOpenAdminModal,
  isAdminLoggedIn,
  onToggleAdminView,
  onLogoutAdmin,
  activeView,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-sky-100/90 shadow-sm shadow-sky-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Branding & Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div
            className={`flex items-center gap-3 ${activeView === 'quiz' ? 'cursor-default opacity-90' : 'cursor-pointer group'}`}
            onClick={() => {
              if (activeView === 'quiz') return;
              if (onGoHome) onGoHome();
              else window.location.href = '/';
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-sky-200/80 shadow-md shadow-sky-500/15 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center p-0.5 overflow-hidden">
              <img
                src="https://i.postimg.cc/wjfX1FjT/1046030632-(4).jpg"
                alt="โลโก้โรงเรียนสมเด็จพิทยาคม"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="leading-tight">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                โรงเรียนสมเด็จพิทยาคม
              </h1>
              <p className="text-xs text-sky-700 font-semibold">
                ระบบแบบทดสอบ AI Assistants for Teachers
              </p>
            </div>
          </div>

          {/* Mobile Admin Button */}
          <div className="md:hidden flex items-center gap-2">
            {isAdminLoggedIn && activeView === 'admin' ? (
              <button
                onClick={onLogoutAdmin || onToggleAdminView}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs flex items-center gap-1.5 shadow-sm"
                title="ออกจากระบบผู้ดูแลระบบ"
                suppressHydrationWarning
              >
                <LogOut className="w-4 h-4 text-rose-600" />
              </button>
            ) : (
              <button
                onClick={isAdminLoggedIn ? onToggleAdminView : onOpenAdminModal}
                className="p-2 rounded-xl bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 text-xs flex items-center gap-1.5 shadow-sm"
                suppressHydrationWarning
              >
                <LayoutDashboard className="w-4 h-4 text-sky-600" />
              </button>
            )}
          </div>
        </div>

        {/* Center/Right: Live System Status Badges */}
        <div className="flex items-center gap-2">
          {/* Pre-test status pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
            preOpen
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-2xs'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${preOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>Pre-test: {preOpen ? 'เปิดสอบ' : 'ปิด'}</span>
          </div>

          {/* Post-test status pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
            postOpen
              ? 'bg-sky-50 text-sky-800 border-sky-200/80 shadow-2xs'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${postOpen ? 'bg-sky-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>Post-test: {postOpen ? 'เปิดสอบ' : 'ปิด'}</span>
          </div>
        </div>

        {/* Admin Trigger / Logout at Top-Right */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {isAdminLoggedIn ? (
            activeView === 'admin' ? (
              <button
                onClick={onLogoutAdmin || onToggleAdminView}
                className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all bg-rose-50/90 hover:bg-rose-100 text-rose-700 border-rose-200 hover:border-rose-300 shadow-2xs hover:scale-[1.02]"
                title="ออกจากระบบผู้ดูแลระบบ และกลับสู่หน้าแรก"
                suppressHydrationWarning
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>ออกจากระบบ</span>
              </button>
            ) : (
              <button
                onClick={onToggleAdminView}
                className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all bg-white hover:bg-sky-50 text-sky-700 border-sky-200 shadow-sm"
                suppressHydrationWarning
              >
                <LayoutDashboard className="w-4 h-4 text-sky-600" />
                <span>แอดมินแดชบอร์ด</span>
              </button>
            )
          ) : (
            <button
              onClick={onOpenAdminModal}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
              suppressHydrationWarning
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>ผู้ดูแลระบบ</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
