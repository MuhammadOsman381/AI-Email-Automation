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
import { useEffect, useState } from "react"

export default function App() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setEnabled(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const toggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);

    localStorage.setItem("theme", newValue ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newValue);
  };


  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between  border-b px-4">
          <div className="flex items-center ">
            <SidebarTrigger className="-ml-1 " />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4 "
            />
            <div>
              AI Email Agent
            </div>
          </div>
          <button
            onClick={toggle}
            className={`relative w-10 h-7 flex items-center rounded-full p-1 transition-colors duration-300
        ${enabled ? "bg-blue-950" : "bg-gray-300"}`}
          >
            <span
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300
          ${enabled ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </header>
        <div className="flex flex-1 flex-col overflow-auto gap-4 p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/compose-email" element={<ComposeEmail enabled={enabled} />} />
            <Route path="/guide" element={<Guide />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
