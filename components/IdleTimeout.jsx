"use client";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

export default function IdleTimeout({ minutes = 30 }) {
  useIdleTimeout(minutes);
  return null;
}