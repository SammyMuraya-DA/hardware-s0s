import { MessageCircle } from "lucide-react";

export function WhatsAppWidget() {
  return (
    <a
      href="https://wa.me/254707209775?text=Hi%20Steve%2C%20I%20need%20help%20with..."
      target="_blank"
      rel="noopener"
      className="fixed bottom-20 lg:bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-pulse-amber group"
      title="Chat with Steve"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-background text-foreground text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-border">
        Chat with Steve
      </span>
    </a>
  );
}
