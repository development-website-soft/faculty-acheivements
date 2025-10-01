import type React from "react"
import HODLayout from "@/components/layout/hod-layout"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <HODLayout>{children}</HODLayout>
}
