"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../app/providers";

const PUBLIC_ROUTES = new Set(["/login", "/register"]);

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isPublic = PUBLIC_ROUTES.has(pathname ?? "/");
    if (!isAuthenticated && !isPublic) {
      router.replace("/login");
    }
    setChecked(true);
  }, [isAuthenticated, pathname, router]);

  if (!checked) return null;
  return <>{children}</>;
}


