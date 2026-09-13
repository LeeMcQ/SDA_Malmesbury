"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";

export function PwaRuntime() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
