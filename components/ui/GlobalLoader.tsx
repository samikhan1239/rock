import { GraduationCap, Sparkles } from "lucide-react";

export default function GlobalLoader() {
  return (
    <main
      className="fixed inset-0 z-[99999] flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFF]"
      role="status"
      aria-label="Loading TutorSathi"
    >
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-indigo-200/30 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-blue-200/30 blur-[100px]" />

      <div className="relative flex flex-col items-center">
        {/* Animated Logo */}
        <div className="relative mb-5">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-indigo-400/20" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200/70">
            <GraduationCap size={34} strokeWidth={1.8} />
          </div>

          <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-white">
            <Sparkles size={12} />
          </div>
        </div>

        {/* Brand */}
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Tutor<span className="text-indigo-600">Sathi</span>
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Making learning better, together.
        </p>

        {/* Loading indicator */}
        <div className="mt-8 h-1 w-36 overflow-hidden rounded-full bg-indigo-100">
          <div className="h-full w-1/2 animate-[loader_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
        </div>

        <p className="mt-3 text-xs font-medium tracking-wide text-slate-400">
          Just a moment...
        </p>
      </div>

      <style>{`
        @keyframes loader {
          0% {
            transform: translateX(-110%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </main>
  );
}