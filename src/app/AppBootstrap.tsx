import React, { useState, useEffect } from "react";
import { AppSplash } from "../components/home/AppSplash";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../providers/DataProvider";

export default function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { userId, authReady: authLoading } = useAuth();
  const { preloadHome, preloadInsights, preloadLab, homeReady } = useData();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    async function bootstrap() {
      if (userId) {
        await Promise.all([
          preloadHome(),     // ✅ THIS is what stops HomeSkeleton
          preloadInsights(),
          preloadLab(),
        ]);
      }
      setBootstrapped(true);
    }

    bootstrap();
  }, [authLoading, userId]);

  console.log("CHECK THIS" , bootstrapped, userId, homeReady)

  if (!bootstrapped || (userId && !homeReady)) {
    
    return <AppSplash />;
  }

  return <>{children}</>;
}
