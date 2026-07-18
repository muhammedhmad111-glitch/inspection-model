import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-brand-purple to-brand-purple-strong p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold tracking-tight text-brand-navy shadow-lg">
            AC
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-wide text-white">
            AMREYAH CEMENT
          </h1>
          <p className="text-sm text-white/60">نظام فحص وصيانة مصنع الأسمنت</p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
