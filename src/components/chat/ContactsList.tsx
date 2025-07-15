
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Contact = {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  unreadCount: number;
};

interface ContactsListProps {
  contacts: Contact[];
  activeContactId: number | null;
  onSelectContact: (id: number) => void;
}

export default function ContactsList({ contacts, activeContactId, onSelectContact }: ContactsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b sticky top-0 bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Procurar contatos" 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Nenhum contato encontrado
          </div>
        ) : (
          filteredContacts.map(contact => (
            <div 
              key={contact.id} 
              className={cn(
                "contact-item flex items-center gap-3", 
                activeContactId === contact.id && "active"
              )}
              onClick={() => onSelectContact(contact.id)}
            >
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {contact.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium truncate">{contact.name}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{contact.timestamp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.status === "sent" && contact.lastMessage.startsWith("Você: ") 
                      ? contact.lastMessage 
                      : contact.status === "sent" || contact.status === "delivered" || contact.status === "read" 
                        ? `Você: ${contact.lastMessage}` 
                        : contact.lastMessage}
                  </p>
                  {contact.unreadCount > 0 && (
                    <span className="ml-2 bg-whatsapp-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
