
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { ChangePasswordForm } from "./ChangePasswordForm";

export function AccountSettings() {
  return (
    <Card className="shadow-xl bg-gradient-to-tr from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-0 rounded-2xl transition-all duration-300">
      <CardHeader className="rounded-t-2xl pb-2 bg-white/60 dark:bg-gray-950/60">
        <CardTitle className="flex items-center gap-2 font-semibold text-primary">
          <Lock className="h-5 w-5 text-primary" />
          Alterar Senha
        </CardTitle>
        <CardDescription className="text-gray-500">
          Altere sua senha de acesso ao sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm />
      </CardContent>
    </Card>
  );
}
