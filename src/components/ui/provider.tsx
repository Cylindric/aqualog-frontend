"use client"
import { MantineProvider } from "@mantine/core"
import type { ReactNode } from "react"

export function Provider({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>
}
