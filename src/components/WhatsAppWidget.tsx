import { useMemo, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatPrice,
  getStockStatus,
  useCategories,
  useProducts,
  useSiteContent,
  type DbCategory,
  type DbProduct,
} from "@/hooks/useProducts";

type ChatRole = "assistant" | "user";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface AssistantCategory {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  productCount?: number;
}

interface AssistantProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  categoryId: string;
  stockQuantity: number;
  lowStockThreshold: number;
  sku: string;
  unit: string;
  brand: string;
  isActive: boolean;
  isFeatured: boolean;
  isOnOffer: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  offerLabel?: string | null;
  specifications?: Record<string, string>;
}

interface StoreKnowledge {
  greeting: string;
  fallbackTopics: string;
  businessSummary: string;
  supportSummary: string;
  services: string[];
  delivery: string;
  payment: string;
  contact: string;
}

const quickPrompts = [
  "Show me door locks",
  "What is on offer?",
  "I need plumbing items",
  "Tell me about Digital Keypad Door Lock",
];

const defaultStoreKnowledge: StoreKnowledge = {
  greeting:
    "Hi, I’m your shopping assistant. I know the full product catalog and can help with products, prices, stock, offers, specifications, delivery, payment, and store guidance.",
  fallbackTopics:
    "door locks, glass, roofing, plumbing, tools, fasteners, offers, best sellers, stock, specs, delivery, services, or M-Pesa",
  businessSummary:
    "We help customers shop for hardware, glass, roofing, plumbing, fittings, tools, paints, and site essentials.",
  supportSummary:
    "I can help with product recommendations, stock checks, sizes, materials, specifications, compatibility questions, and bulk orders.",
  services: [
    "Glass cutting",
    "Measurement support",
    "Delivery coordination",
    "Installation guidance",
    "Paint matching",
    "Bulk project supply",
  ],
  delivery:
    "Pickup is available in Nyeri Town, and delivery is available in Nyeri and upcountry for selected orders.",
  payment:
    "You can pay instantly with M-Pesa. Some pickup or selected delivery orders may also support pay-later arrangements.",
  contact:
    "For direct help, customers can call or chat on WhatsApp with the team for quotes, advice, orders, and stock confirmation.",
};

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1);
}

function normalizeSpecifications(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== null && item !== undefined)
    .map(([key, item]) => [key, String(item)]);

  return entries.length ? Object.fromEntries(entries) : undefined;
}

function normalizeCategory(category: DbCategory): AssistantCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    tagline: category.tagline ?? "Browse available products in this category",
  };
}

function normalizeProduct(product: DbProduct): AssistantProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "No description available yet.",
    price: product.price,
    originalPrice: product.original_price,
    categoryId: product.category_id ?? "",
    stockQuantity: product.stock_quantity,
    lowStockThreshold: product.low_stock_threshold ?? 5,
    sku: product.sku ?? "Not specified",
    unit: product.unit ?? "piece",
    brand: product.brand ?? "Generic",
    isActive: product.is_active ?? true,
    isFeatured: product.is_featured ?? false,
    isOnOffer: product.is_on_offer ?? false,
    isNewArrival: product.is_new_arrival ?? false,
    isBestSeller: product.is_best_seller ?? false,
    offerLabel: product.offer_label,
    specifications: normalizeSpecifications(product.specifications),
  };
}

function buildStoreKnowledge(siteContent: Record<string, { value: string | null; image_url: string | null }> | undefined): StoreKnowledge {
  return {
    greeting: siteContent?.assistant_greeting?.value || defaultStoreKnowledge.greeting,
    fallbackTopics: defaultStoreKnowledge.fallbackTopics,
    businessSummary:
      siteContent?.homepage_intro?.value ||
      siteContent?.hero_subtitle?.value ||
      defaultStoreKnowledge.businessSummary,
    supportSummary: siteContent?.contact_support_copy?.value || defaultStoreKnowledge.supportSummary,
    services: defaultStoreKnowledge.services,
    delivery: siteContent?.delivery_info?.value || defaultStoreKnowledge.delivery,
    payment: siteContent?.payment_info?.value || defaultStoreKnowledge.payment,
    contact:
      siteContent?.contact_info?.value ||
      siteContent?.navbar_top_text?.value ||
      defaultStoreKnowledge.contact,
  };
}

function getCategoryById(categoryId: string, categories: AssistantCategory[]) {
  return categories.find((category) => category.id === categoryId);
}

function buildProductSearchText(product: AssistantProduct, categories: AssistantCategory[]) {
  const category = getCategoryById(product.categoryId, categories);

  return [
    product.name,
    product.slug,
    product.description,
    product.brand,
    product.sku,
    product.unit,
    category?.name,
    category?.slug,
    category?.tagline,
    ...(product.specifications ? Object.entries(product.specifications).flatMap(([key, value]) => [key, value]) : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreProductMatch(product: AssistantProduct, query: string, categories: AssistantCategory[]) {
  const normalizedQuery = normalizeText(query);
  const searchText = buildProductSearchText(product, categories);
  const queryWords = tokenize(normalizedQuery);
  let score = 0;

  if (searchText.includes(normalizedQuery)) score += 12;
  if (product.name.toLowerCase().includes(normalizedQuery)) score += 15;
  if (product.slug.toLowerCase().includes(normalizedQuery)) score += 10;
  if (product.brand.toLowerCase().includes(normalizedQuery)) score += 6;
  if (product.sku.toLowerCase().includes(normalizedQuery)) score += 8;

  for (const word of queryWords) {
    if (product.name.toLowerCase().includes(word)) score += 5;
    if (searchText.includes(word)) score += 2;
  }

  if (product.isFeatured) score += 1;
  if (product.isBestSeller) score += 1;
  if (product.stockQuantity > 0) score += 1;

  return score;
}

function getStockLabel(product: AssistantProduct) {
  if (product.stockQuantity === 0) return "out of stock";
  if (product.stockQuantity <= product.lowStockThreshold) return `low stock (${product.stockQuantity} left)`;
  return `in stock (${product.stockQuantity})`;
}

function formatProductLine(product: AssistantProduct) {
  const extras = [
    product.brand ? `brand: ${product.brand}` : null,
    product.unit ? `unit: ${product.unit}` : null,
    `stock: ${getStockLabel(product)}`,
    product.isOnOffer && product.originalPrice ? `was ${formatPrice(product.originalPrice)}` : null,
    product.offerLabel ? `offer: ${product.offerLabel}` : null,
  ].filter(Boolean);

  return `• ${product.name} — ${formatPrice(product.price)}${extras.length ? ` (${extras.join(", ")})` : ""}`;
}

function formatSpecifications(product: AssistantProduct) {
  if (!product.specifications || !Object.keys(product.specifications).length) {
    return "No extra specifications are listed for this product yet.";
  }

  return Object.entries(product.specifications)
    .map(([key, value]) => `• ${key}: ${value}`)
    .join("\n");
}

function formatFullProductKnowledge(product: AssistantProduct, categories: AssistantCategory[]) {
  const category = getCategoryById(product.categoryId, categories);

  const highlights = [
    product.isFeatured ? "Featured" : null,
    product.isBestSeller ? "Best Seller" : null,
    product.isNewArrival ? "New Arrival" : null,
    product.isOnOffer ? "On Offer" : null,
  ].filter(Boolean);

  return [
    `${product.name}`,
    `Price: ${formatPrice(product.price)}${product.originalPrice ? ` (was ${formatPrice(product.originalPrice)})` : ""}`,
    `Category: ${category?.name ?? "General"}${category?.tagline ? ` — ${category.tagline}` : ""}`,
    `Brand: ${product.brand || "Not specified"}`,
    `SKU: ${product.sku || "Not specified"}`,
    `Unit: ${product.unit || "Not specified"}`,
    `Availability: ${getStockLabel(product)}`,
    highlights.length ? `Highlights: ${highlights.join(", ")}` : null,
    product.offerLabel ? `Offer label: ${product.offerLabel}` : null,
    `Description: ${product.description}`,
    `Specifications:\n${formatSpecifications(product)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatCategoryKnowledge(category: AssistantCategory, products: AssistantProduct[]) {
  const categoryProducts = products.filter((product) => product.categoryId === category.id && product.isActive);
  const bestInCategory = categoryProducts.slice(0, 5).map(formatProductLine).join("\n");

  return [
    `${category.name}`,
    `${category.tagline}`,
    `Products available: ${categoryProducts.length}`,
    bestInCategory ? `Sample products:\n${bestInCategory}` : "No active products are currently listed in this category.",
  ].join("\n\n");
}

function getMatchedCategory(query: string, categories: AssistantCategory[]) {
  const queryTokens = tokenize(query);

  return categories.find((category) => {
    const categoryText = [category.name, category.slug, category.tagline].join(" ").toLowerCase();
    const categoryTokens = tokenize(categoryText);

    return categoryText.includes(query) || categoryTokens.some((word) => queryTokens.includes(word));
  });
}

function getBestProductMatches(query: string, products: AssistantProduct[], categories: AssistantCategory[], limit = 5) {
  return products
    .filter((product) => product.isActive)
    .map((product) => ({ product, score: scoreProductMatch(product, query, categories) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product);
}

function buildCatalogKnowledge(products: AssistantProduct[], categories: AssistantCategory[]) {
  const activeProducts = products.filter((product) => product.isActive);
  const categorySummary = categories
    .map((category) => {
      const count = activeProducts.filter((product) => product.categoryId === category.id).length;
      return `• ${category.name}: ${count} product${count === 1 ? "" : "s"}`;
    })
    .join("\n");

  return `Catalog summary:\n• Total active products: ${activeProducts.length}\n• Categories: ${categories.length}\n${categorySummary}`;
}

function buildAssistantReply(
  message: string,
  products: AssistantProduct[],
  categories: AssistantCategory[],
  storeKnowledge: StoreKnowledge
) {
  const query = normalizeText(message);

  if (!query) {
    return `${storeKnowledge.greeting}\n\nAsk me about a product, category, price, stock level, specifications, offers, delivery, or payment options.`;
  }

  if (
    query.includes("hello") ||
    query.includes("hi") ||
    query.includes("hey") ||
    query.includes("good morning") ||
    query.includes("good afternoon")
  ) {
    return `${storeKnowledge.greeting}\n\n${storeKnowledge.businessSummary}\n${storeKnowledge.supportSummary}`;
  }

  if (
    query.includes("all products") ||
    query.includes("catalog") ||
    query.includes("everything you have") ||
    query.includes("all product knowledge")
  ) {
    return `${buildCatalogKnowledge(products, categories)}\n\nAsk me for a category or exact product name and I’ll give you full product details including price, stock, SKU, unit, and specifications.`;
  }

  if (
    query.includes("service") ||
    query.includes("can you do") ||
    query.includes("help with installation") ||
    query.includes("glass cutting") ||
    query.includes("paint matching")
  ) {
    return `We also support customers with:\n${storeKnowledge.services.map((service) => `• ${service}`).join("\n")}\n\n${storeKnowledge.supportSummary}`;
  }

  if (
    query.includes("delivery") ||
    query.includes("pickup") ||
    query.includes("ship") ||
    query.includes("location")
  ) {
    return `${storeKnowledge.delivery}\n\n${storeKnowledge.contact}`;
  }

  if (
    query.includes("mpesa") ||
    query.includes("m-pesa") ||
    query.includes("payment") ||
    query.includes("pay")
  ) {
    return `${storeKnowledge.payment}\n\n${storeKnowledge.contact}`;
  }

  if (
    query.includes("contact") ||
    query.includes("whatsapp") ||
    query.includes("call") ||
    query.includes("quote") ||
    query.includes("bulk order")
  ) {
    return `${storeKnowledge.contact}\n\n${storeKnowledge.supportSummary}`;
  }

  if (query.includes("offer") || query.includes("discount") || query.includes("sale")) {
    const offerProducts = products.filter((product) => product.isOnOffer && product.isActive).slice(0, 5);

    if (!offerProducts.length) {
      return "There are no active offers right now, but I can still recommend good-value products for your project.";
    }

    return `Current offers:\n${offerProducts.map(formatProductLine).join("\n")}`;
  }

  if (query.includes("best seller") || query.includes("popular") || query.includes("recommended")) {
    const bestSellers = products.filter((product) => product.isBestSeller && product.isActive).slice(0, 5);

    if (!bestSellers.length) {
      return "I don’t have featured best sellers right now, but I can still recommend products by category or budget.";
    }

    return `Popular picks right now:\n${bestSellers.map(formatProductLine).join("\n")}`;
  }

  if (query.includes("new arrival") || query.includes("new stock") || query.includes("latest")) {
    const newArrivals = products.filter((product) => product.isNewArrival && product.isActive).slice(0, 5);

    if (!newArrivals.length) {
      return "There are no marked new arrivals right now, but I can still help you find current in-stock items.";
    }

    return `New arrivals:\n${newArrivals.map(formatProductLine).join("\n")}`;
  }

  const matchedCategory = getMatchedCategory(query, categories);

  if (
    matchedCategory &&
    (query.includes("category") || query.includes("items") || query.includes("show me") || query.includes("need"))
  ) {
    return formatCategoryKnowledge(matchedCategory, products);
  }

  const productMatches = getBestProductMatches(query, products, categories, 5);

  if (productMatches.length === 1) {
    return formatFullProductKnowledge(productMatches[0], categories);
  }

  const exactNamedProduct = products.find(
    (product) =>
      normalizeText(product.name) === query || normalizeText(product.slug) === query || normalizeText(product.sku) === query
  );

  if (exactNamedProduct) {
    return formatFullProductKnowledge(exactNamedProduct, categories);
  }

  if (
    productMatches.length &&
    (query.includes("tell me about") ||
      query.includes("details") ||
      query.includes("spec") ||
      query.includes("specification") ||
      query.includes("price") ||
      query.includes("sku"))
  ) {
    return formatFullProductKnowledge(productMatches[0], categories);
  }

  if (matchedCategory) {
    return formatCategoryKnowledge(matchedCategory, products);
  }

  if (productMatches.length) {
    return `I found these matching products:\n${productMatches.map(formatProductLine).join("\n")}\n\nAsk me for details about any one of them and I’ll share the full product knowledge.`;
  }

  const inStockProducts = products.filter((product) => product.isActive && product.stockQuantity > 0).slice(0, 4);

  return `I couldn’t find an exact match for "${message}", but I can still help.\n\n${buildCatalogKnowledge(products, categories)}\n\nSuggested products:\n${inStockProducts
    .map(formatProductLine)
    .join("\n")}\n\nYou can also ask about ${storeKnowledge.fallbackTopics}.`;
}

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const { data: dbProducts, isLoading: isProductsLoading } = useProducts();
  const { data: dbCategories, isLoading: isCategoriesLoading } = useCategories();
  const { data: siteContent } = useSiteContent();

  const categories = useMemo<AssistantCategory[]>(
    () => (dbCategories ?? []).map(normalizeCategory),
    [dbCategories]
  );

  const products = useMemo<AssistantProduct[]>(
    () => (dbProducts ?? []).map(normalizeProduct).filter((product) => product.isActive),
    [dbProducts]
  );

  const storeKnowledge = useMemo(() => buildStoreKnowledge(siteContent), [siteContent]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: defaultStoreKnowledge.greeting,
    },
  ]);

  const suggestions = useMemo(() => quickPrompts, []);
  const isKnowledgeLoading = isProductsLoading || isCategoriesLoading;

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
      content: buildAssistantReply(trimmedMessage, products, categories, storeKnowledge),
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInputValue("");
    setIsOpen(true);
  };

  const startConversation = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `${storeKnowledge.greeting}\n\n${buildCatalogKnowledge(products, categories)}`,
      },
    ]);
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 lg:bottom-6">
      {isOpen && (
        <div className="mb-4 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Shopping Assistant</p>
                <p className="text-xs text-primary-foreground/80">
                  Live catalog help for products, specs, stock, delivery, and offers
                </p>
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

          <div className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            {isKnowledgeLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading live catalog knowledge…
              </span>
            ) : (
              `Using live catalog knowledge from your current product database.`
            )}
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
                placeholder="Ask for a product, category, specs, stock, or delivery info..."
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" size="icon" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>

            <button
              type="button"
              onClick={startConversation}
              className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Refresh assistant knowledge
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (!isOpen && messages.length === 1) {
            startConversation();
            return;
          }

          setIsOpen((current) => !current);
        }}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
        title="Open shopping assistant"
        aria-label="Open shopping assistant"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground opacity-0 transition-opacity group-hover:opacity-100">
          Shopping Assistant
        </span>
      </button>
    </div>
  );
}
