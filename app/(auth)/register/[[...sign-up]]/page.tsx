import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Branding Section */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#101B3D] p-10 text-white lg:flex xl:p-14">
          {/* Background decorations */}
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

          {/* Logo */}
          <Link href="/" className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>

            <span className="text-2xl font-bold tracking-tight">
              Tutor<span className="text-indigo-400">Sathi</span>
            </span>
          </Link>

          {/* Main content */}
          <div className="relative z-10 max-w-lg">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-indigo-200">
              <Sparkles className="h-4 w-4" />
              Your learning journey starts here
            </div>

            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
              Better learning
              <br />
              starts with the
              <br />
              <span className="text-indigo-400">right connection.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              Join TutorSathi to discover verified educators, connect with
              students, and make quality education more accessible.
            </p>

            <div className="mt-10 space-y-5">
              {[
                {
                  icon: BadgeCheck,
                  title: "Verified educators",
                  description: "Learn from evaluated and verified teachers.",
                },
                {
                  icon: Sparkles,
                  title: "AI-powered assessment",
                  description: "Smart teacher evaluation and matching.",
                },
                {
                  icon: Users,
                  title: "A growing community",
                  description: "Connect with learners and educators.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <item.icon className="h-5 w-5 text-indigo-300" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
            <span>© 2026 TutorSathi. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Secure registration
            </span>
          </div>
        </section>

        {/* Right Signup Section */}
        <section className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
          {/* Mobile logo */}
          <Link
            href="/"
            className="mb-8 flex items-center gap-2 lg:hidden"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>

            <span className="text-xl font-bold text-slate-900">
              Tutor<span className="text-indigo-600">Sathi</span>
            </span>
          </Link>

          <div className="w-full max-w-[440px]">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="mb-7">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <BookOpen className="h-4 w-4" />
                JOIN TUTORSATHI
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Get started by creating your TutorSathi account.
              </p>
            </div>

            {/* Clerk Sign Up */}
            <SignUp
              forceRedirectUrl="/after-login"
              signInUrl="/login"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "w-full bg-transparent shadow-none border-0 p-0",

                  headerTitle: "text-2xl font-bold text-slate-900",
                  headerSubtitle: "text-sm text-slate-500",

                  socialButtonsBlockButton:
                    "h-11 rounded-lg border border-slate-200 bg-white shadow-none hover:bg-slate-50",

                  socialButtonsBlockButtonText:
                    "text-sm font-medium text-slate-700",

                  dividerLine: "bg-slate-200",
                  dividerText: "text-xs text-slate-400",

                  formFieldLabel:
                    "text-sm font-medium text-slate-700",

                  formFieldInput:
                    "h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",

                  formButtonPrimary:
                    "h-11 rounded-lg bg-indigo-600 text-sm font-semibold shadow-none hover:bg-indigo-700",

                  footerActionLink:
                    "font-semibold text-indigo-600 hover:text-indigo-700",

                  identityPreview:
                    "rounded-lg border border-slate-200 bg-white",

                  formFieldInputShowPasswordButton:
                    "text-slate-500 hover:text-indigo-600",
                },
              }}
            />

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              By creating an account, you agree to use TutorSathi responsibly
              and provide accurate information.
            </p>
          </div>

          {/* Mobile footer */}
          <p className="mt-10 text-center text-xs text-slate-400 lg:hidden">
            © 2026 TutorSathi. All rights reserved.
          </p>
        </section>
      </div>
    </main>
  );
}