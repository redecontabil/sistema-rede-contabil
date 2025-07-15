
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Paperclip, Send, Smile } from "lucide-react";

type Message = {
  id: number;
  content: string;
  timestamp: string;
  type: "inbound" | "outbound";
  status?: "sent" | "delivered" | "read";
};

type Contact = {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
  online?: boolean;
  lastSeen?: string;
};

interface ConversationProps {
  contact: Contact | null;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onBack?: () => void;
}

export default function Conversation({ contact, messages, onSendMessage, onBack }: ConversationProps) {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!contact) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground">Selecione um contato para ver a conversa</p>
      </div>
    );
  }

  return (
    <>
      <div className="conversation-header">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Button>
          )}
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {contact.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-white">{contact.name}</div>
            <div className="text-xs text-white/80">
              {contact.online ? 'Online' : contact.lastSeen ? `Visto por último: ${contact.lastSeen}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="messages-area flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Nenhuma mensagem ainda. Diga olá!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.type === "inbound" ? "message-inbound" : "message-outbound"}`}
            >
              <div>{message.content}</div>
              <div className="text-xs text-right mt-1 text-gray-500">
                {message.timestamp}
                {message.status && message.type === "outbound" && (
                  <span className="ml-1">
                    {message.status === "sent" && "✓"}
                    {message.status === "delivered" && "✓✓"}
                    {message.status === "read" && <span className="text-blue-500">✓✓</span>}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="message-input flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Smile className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon">
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Input 
          placeholder="Digite uma mensagem" 
          className="flex-1"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="bg-whatsapp-green text-primary-foreground hover:bg-whatsapp-green/90 rounded-full"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
