import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-ink p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center bg-brand-red text-xl font-extrabold tracking-tight text-white">
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
