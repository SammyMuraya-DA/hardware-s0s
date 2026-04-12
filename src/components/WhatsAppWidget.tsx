import { useMemo, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { products, categories, formatPrice } from "@/data/products";

type ChatRole = "assistant" | "user";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const quickPrompts = [
  "Show me door locks",
  "What is on offer?",
  "I need plumbing items",
  "Recommend best sellers",
];

function buildAssistantReply(message: string) {
  const query = message.toLowerCase().trim();

  if (!query) {
    return "Tell me what you need for your project and I’ll suggest products, prices, and categories.";
  }

  if (query.includes("offer") || query.includes("discount") || query.includes("sale")) {
    const offerProducts = products.filter((product) => product.isOnOffer && product.isActive);
    if (!offerProducts.length) {
      return "There are no active offers right now, but I can still recommend good-value items for your project.";
    }

    return `Current offers:\n${offerProducts
      .map((product) => `• ${product.name} — ${formatPrice(product.price)}`)
      .join("\n")}`;
  }

  if (query.includes("best seller") || query.includes("popular")) {
    const bestSellers = products.filter((product) => product.isBestSeller && product.isActive).slice(0, 4);
    return `Popular picks right now:\n${bestSellers
      .map((product) => `• ${product.name} — ${formatPrice(product.price)}`)
      .join("\n")}`;
  }

  const matchedCategory = categories.find(
    (category) =>
      query.includes(category.name.toLowerCase()) ||
      query.includes(category.slug.toLowerCase()) ||
      query.includes(category.tagline.toLowerCase()) ||
      category.name
        .toLowerCase()
        .split(/[\s&]+/)
        .some((word) => word.length > 3 && query.includes(word))
  );

  if (matchedCategory) {
    const categoryProducts = products
      .filter((product) => product.categoryId === matchedCategory.id && product.isActive)
      .slice(0, 4);

    if (!categoryProducts.length) {
      return `I found the ${matchedCategory.name} category, but there are no active products listed there right now.`;
    }

    return `Here are some ${matchedCategory.name} options:\n${categoryProducts
      .map((product) => `• ${product.name} — ${formatPrice(product.price)}`)
      .join("\n")}`;
  }

  const productMatches = products
    .filter((product) => {
      const searchableText = [
        product.name,
        product.description,
        product.brand,
        product.sku,
        product.unit,
        ...(product.specifications ? Object.values(product.specifications) : []),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    })
    .slice(0, 4);

  if (productMatches.length) {
    return `I found these matching products:\n${productMatches
      .map(
        (product) =>
          `• ${product.name} — ${formatPrice(product.price)}${product.stockQuantity === 0 ? " (out of stock)" : ""}`
      )
      .join("\n")}`;
  }

  const inStockProducts = products.filter((product) => product.isActive && product.stockQuantity > 0).slice(0, 4);

  return `I couldn’t find an exact match for "${message}", but these are good options to start with:\n${inStockProducts
    .map((product) => `• ${product.name} — ${formatPrice(product.price)}`)
    .join("\n")}\n\nYou can also ask for locks, glass, roofing, plumbing, tools, offers, or best sellers.`;
}

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I’m your shopping assistant. I can help you find products, prices, offers, and category recommendations.",
    },
  ]);

  const suggestions = useMemo(() => quickPrompts, []);

  const sendMessage = (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      content: buildAssistantReply(trimmedMessage),
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInputValue("");
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Shopping Assistant</p>
                <p className="text-xs text-primary-foreground/80">Ask about products, prices, and offers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-primary-foreground/10"
              aria-label="Close shopping assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                  message.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "ml-auto bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(inputValue);
              }}
            >
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask for a product or category..."
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" size="icon" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
        title="Open shopping assistant"
        aria-label="Open shopping assistant"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute right-full mr-3 rounded-lg border border-border bg-background px-3 py-1.5 text-sm whitespace-nowrap text-foreground opacity-0 transition-opacity group-hover:opacity-100">
          Shopping Assistant
        </span>
      </button>
    </div>
  );
}
