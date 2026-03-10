"use client";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

export default function IdleTimeout({ minutes = 30 }) {
  console.log("IdleTimeout mounted, minutes:", minutes);
  useIdleTimeout(minutes);
  return null;
}