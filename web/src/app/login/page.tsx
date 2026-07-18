import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-ink p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center bg-brand-red text-xl font-extrabold tracking-tight text-white">
            AC
          </div>
          <h1 className="mt-1 text-xl font-bold uppercase tracking-wide text-white">
            Amreyah Cement
          </h1>
          <p className="text-sm text-white/60">نظام فحص وصيانة مصنع الأسمنت</p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
