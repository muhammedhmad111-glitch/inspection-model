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
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-2xl font-extrabold text-primary shadow-lg">
            C
          </div>
          <h1 className="mt-2 text-lg font-extrabold text-white">
            CIMPOR AMREYAH
          </h1>
          <p className="text-sm text-white/70">
            نظام فحص وصيانة مصنع الأسمنت
          </p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
