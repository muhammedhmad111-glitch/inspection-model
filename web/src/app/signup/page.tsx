import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-brand-purple to-brand-purple-strong p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold tracking-tight text-brand-navy shadow-lg">
            AC
          </div>
          <h1 className="mt-2 text-lg font-extrabold text-white">إنشاء حساب جديد</h1>
          <p className="text-sm text-white/70">
            سجّل بياناتك وسيقوم المدير العام بتفعيل حسابك وتحديد دورك
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
