
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom CopyBlock component to replace the missing import
function CopyBlock({ 
  text, 
  language, 
  showLineNumbers = false, 
  theme, 
  wrapLongLines = false 
}: { 
  text: string, 
  language: string, 
  showLineNumbers?: boolean, 
  theme?: any, 
  wrapLongLines?: boolean,
  codeBlock?: boolean
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={theme}
        showLineNumbers={showLineNumbers}
        wrapLongLines={wrapLongLines}
        customStyle={{ margin: 0, padding: "1rem", borderRadius: "0.5rem" }}
      >
        {text}
      </SyntaxHighlighter>
    </div>
  );
}

export default function Documentation() {
  const [selectedLanguage, setSelectedLanguage] = useState<"curl" | "javascript" | "python">("javascript");
  const { theme } = useTheme();
  
  const endpointExamples = [
    {
      name: "Enviar Mensagem",
      endpoint: "/v1/messages/send",
      method: "POST",
      description: "Envia uma mensagem de texto para um contato ou grupo.",
      params: {
        phone: "Número do telefone com código do país (Ex: 5511999990000)",
        message: "Texto da mensagem a ser enviada",
      },
      examples: {
        curl: `curl -X POST https://api.meuwhats.com/v1/messages/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "phone": "5511999990000",
    "message": "Olá, esta é uma mensagem de teste!"
  }'`,
        javascript: `fetch('https://api.meuwhats.com/v1/messages/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    phone: '5511999990000',
    message: 'Olá, esta é uma mensagem de teste!'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
        python: `import requests

url = "https://api.meuwhats.com/v1/messages/send"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
data = {
    "phone": "5511999990000",
    "message": "Olá, esta é uma mensagem de teste!"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`
      }
    },
    {
      name: "Enviar Imagem",
      endpoint: "/v1/messages/send-image",
      method: "POST",
      description: "Envia uma imagem para um contato ou grupo.",
      params: {
        phone: "Número do telefone com código do país",
        image: "URL da imagem ou Base64",
        caption: "(Opcional) Legenda da imagem",
      },
      examples: {
        curl: `curl -X POST https://api.meuwhats.com/v1/messages/send-image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "phone": "5511999990000",
    "image": "https://example.com/image.jpg",
    "caption": "Confira esta imagem!"
  }'`,
        javascript: `fetch('https://api.meuwhats.com/v1/messages/send-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    phone: '5511999990000',
    image: 'https://example.com/image.jpg',
    caption: 'Confira esta imagem!'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
        python: `import requests

url = "https://api.meuwhats.com/v1/messages/send-image"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
data = {
    "phone": "5511999990000",
    "image": "https://example.com/image.jpg",
    "caption": "Confira esta imagem!"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`
      }
    },
    {
      name: "Buscar Contatos",
      endpoint: "/v1/contacts",
      method: "GET",
      description: "Obtém a lista de contatos.",
      params: {
        page: "(Opcional) Número da página",
        limit: "(Opcional) Quantidade de contatos por página",
      },
      examples: {
        curl: `curl -X GET "https://api.meuwhats.com/v1/contacts?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        javascript: `fetch('https://api.meuwhats.com/v1/contacts?page=1&limit=10', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
        python: `import requests

url = "https://api.meuwhats.com/v1/contacts"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
params = {
    "page": 1,
    "limit": 10
}

response = requests.get(url, headers=headers, params=params)
print(response.json())`
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentação da API</h1>
        <p className="text-muted-foreground">
          Guia completo para usar a API do MeuWhats em suas aplicações
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Autenticação</CardTitle>
          <CardDescription>
            Todas as requisições à API precisam ser autenticadas usando uma chave de API (API Key)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Para autenticar suas requisições, inclua o cabeçalho <code className="bg-muted px-1 py-0.5 rounded">Authorization</code> com o valor <code className="bg-muted px-1 py-0.5 rounded">Bearer YOUR_API_KEY</code>.
          </p>
          <p>
            Você pode obter sua API Key na página de <Link to="/settings">Configurações</Link>.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Endpoints</h2>
          <Tabs value={selectedLanguage} onValueChange={(val: string) => setSelectedLanguage(val as any)}>
            <TabsList>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-6">
          {endpointExamples.map((endpoint, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="bg-whatsapp-green text-white px-2 py-1 rounded text-xs font-medium">
                    {endpoint.method}
                  </span>
                  <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                </div>
                <CardDescription>
                  <code className="font-mono">{endpoint.endpoint}</code>
                  <p className="mt-2">{endpoint.description}</p>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Parâmetros</h4>
                  <div className="bg-muted rounded-md p-3">
                    {Object.entries(endpoint.params).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2 mb-1 text-sm">
                        <code className="font-mono">{key}</code>
                        <span className="col-span-2">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Exemplo</h4>
                  <div className="rounded-md overflow-hidden">
                    <CopyBlock
                      text={endpoint.examples[selectedLanguage]}
                      language={selectedLanguage === 'curl' ? 'bash' : selectedLanguage}
                      showLineNumbers
                      theme={theme === 'dark' ? atomDark : vs}
                      wrapLongLines
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper component to avoid prop spreading warning with Typescript
function Link({ to, children, className }: { to: string, children: React.ReactNode, className?: string }) {
  return (
    <a href={to} className={cn("text-whatsapp-green hover:underline", className)}>
      {children}
    </a>
  );
}
