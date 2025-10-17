"use client";

import { usePathname } from "next/navigation";
import React, { Suspense } from "react";
import Header from "./Header";

const HIDE_ON_ROUTES = new Set(["/login", "/register"]);

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader = HIDE_ON_ROUTES.has(pathname ?? "/");
  return (
    <>
      {!hideHeader && (
        <Suspense fallback={null}>
          <Header />
        </Suspense>
      )}
      {children}
    </>
  );
}


