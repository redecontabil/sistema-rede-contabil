import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ClipboardList } from "lucide-react";
import { AccountSettings } from "./settings/AccountSettings";
import { UserManagement } from "./settings/UserManagement";
import { EventosLog } from "./settings/EventosLog";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("conta");
  // Pega email do usuário logado do localStorage
  let userEmail = "";
  let isAdmin = false;
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario_logado") || "null");
    userEmail = usuario?.email || "";
    isAdmin = usuario?.is_admin || false;
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas configurações de conta e sistema
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="conta" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Conta
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="eventos" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Eventos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="conta" className="space-y-6">
          <AccountSettings />
        </TabsContent>
        <TabsContent value="usuarios" className="space-y-6">
          <UserManagement adminEmail={userEmail} />
        </TabsContent>
        <TabsContent value="eventos" className="space-y-6">
          <EventosLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
