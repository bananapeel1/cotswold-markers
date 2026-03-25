"use client";

import { cloneElement, isValidElement, type ReactNode, type ReactElement } from "react";
import { useWeather } from "@/hooks/useWeather";

interface MarkerPageClientProps {
  lat: number;
  lng: number;
  children: ReactNode;
}

export default function MarkerPageClient({
  lat,
  lng,
  children,
}: MarkerPageClientProps) {
  const weather = useWeather(lat, lng);

  // Pass weather prop to ContextualPrompts child
  if (isValidElement(children)) {
    return cloneElement(children as ReactElement<{ weather?: typeof weather }>, {
      weather,
    });
  }

  return <>{children}</>;
}
