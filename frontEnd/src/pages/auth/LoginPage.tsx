import { useState } from "react";
import { ArrowRight, BookOpen, Loader2, Sparkles } from "lucide-react";
import GoogleIcon from "@/assets/google.png";
import ThemeToggle from "@/components/base/ThemeToggle";
import { apiUrl } from "@/config/get-env";

function LoginPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8fafc] px-5 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-[-7rem] h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-[-9rem] h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" />
      </div>

      <section className="relative w-full max-w-[430px] rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900 sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-200">
            C
          </div>
          <span className="text-lg font-semibold tracking-tight">Cortex</span>
        </div>

        <div className="mb-7">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            Your research workspace
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Welcome to Cortex</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to turn your sources into clear answers, notes, and ideas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isRedirecting}
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-wait disabled:opacity-70"
        >
          {isRedirecting ? (
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          ) : (
            <img src={GoogleIcon} alt="" className="h-5 w-5" />
          )}
          <span>{isRedirecting ? "Opening Google…" : "Continue with Google"}</span>
          {!isRedirecting && <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />}
        </button>

        <div className="my-7 h-px bg-slate-100" />

        <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
            <BookOpen className="h-4 w-4" />
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Cortex keeps your notebooks, source files, and generated insights together in one place.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          By continuing, you agree to use Cortex responsibly.
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
