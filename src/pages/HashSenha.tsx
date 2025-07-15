import { useState } from "react";
import bcrypt from "bcryptjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HashSenha() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);

  const gerarHash = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const hashGerado = await bcrypt.hash(senha, 10);
    setHash(hashGerado);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={gerarHash} className="space-y-4 w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-2">Gerar Hash de Senha</h2>
        <div>
          <label className="block mb-1">E-mail</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Senha</label>
          <Input type="text" value={senha} onChange={e => setSenha(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Gerando..." : "Gerar Hash"}
        </Button>
        {hash && (
          <div className="mt-4">
            <label className="block mb-1 font-semibold">Hash gerado:</label>
            <textarea
              className="w-full p-2 border rounded bg-gray-100 text-xs"
              value={hash}
              readOnly
              rows={3}
              onFocus={e => e.target.select()}
            />
            <div className="text-xs text-gray-500 mt-2">Copie o hash acima e cole no campo <b>senha_hash</b> ao cadastrar o usuário no Supabase.</div>
          </div>
        )}
      </form>
    </div>
  );
} 