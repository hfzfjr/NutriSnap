"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { apiFetch, getStoredAuthToken, setStoredAuthToken } from "@/lib/api-client";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const token = getStoredAuthToken();
      if (!token) {
        if (isMounted) {
          const next = encodeURIComponent(pathname);
          router.replace(`/login?next=${next}`);
        }
        return;
      }

      try {
        const res = await apiFetch<{
          user: { id: string; email: string; name: string };
          onboardingCompleted: boolean;
          profile: unknown | null;
        }>("/auth/me");

        if (!isMounted) return;

        // Jika profil belum ada dan bukan di halaman onboarding, arahkan ke onboarding
        if (!res.onboardingCompleted && pathname !== "/onboarding") {
          router.replace("/onboarding");
          return;
        }

        setIsVerifying(false);
      } catch {
        if (isMounted) {
          setStoredAuthToken(null);
          const next = encodeURIComponent(pathname);
          router.replace(`/login?next=${next}`);
        }
      }
    }

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (isVerifying) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 rounded-lg bg-muted/60" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-4">
          <div className="h-44 rounded-xl bg-muted/70" />
          <div className="h-44 rounded-xl bg-muted/70" />
          <div className="h-44 rounded-xl bg-muted/70" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

