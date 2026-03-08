import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Route, Routes } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import ComposeEmail from "./pages/ComposeEmail"
import Guide from "./pages/Guide"

export default function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div>
            AI Email Agent
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/compose-email" element={<ComposeEmail />} />
            <Route path="/guide" element={<Guide />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
