"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const role = localStorage.getItem("hrms.role");
    router.replace(role ? "/dashboard" : "/login");
  }, [router]);
  return null;
}
