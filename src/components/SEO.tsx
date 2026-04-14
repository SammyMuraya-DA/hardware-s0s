import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type SeoConfig = {
  title: string;
  description: string;
  path: string;
  robots?: string;
  keywords?: string;
  type?: string;
};

const SITE_NAME = "SOS Hardware & Glassmart";
const SITE_URL = "https://soshardwareandglassmart.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/placeholder.svg`;

const SEO_BY_ROUTE: Record<string, SeoConfig> = {
  "/": {
    title: "SOS Hardware & Glassmart — Quality Hardware in Kenya",
    description:
      "Shop quality hardware, glass, door locks, roofing, plumbing and tools online from SOS Hardware & Glassmart in Nyeri. Pay with M-Pesa, pickup or delivery available.",
    path: "/",
    keywords:
      "hardware store Kenya, Nyeri hardware, glassmart, building materials Kenya, plumbing supplies, roofing sheets, door locks, tools Kenya",
    type: "website",
  },
  "/products": {
    title: "Hardware Products in Kenya | SOS Hardware & Glassmart",
    description:
      "Browse hardware, glass, tools, plumbing, roofing and building materials from SOS Hardware & Glassmart.",
    path: "/products",
    keywords:
      "hardware products Kenya, building materials Nyeri, buy tools online Kenya",
    type: "website",
  },
  "/offers": {
    title: "Hardware Offers & Deals | SOS Hardware & Glassmart",
    description:
      "Explore current offers on hardware, glass and building materials.",
    path: "/offers",
    keywords: "hardware deals Kenya, discounted tools Kenya",
    type: "website",
  },
  "/about": {
    title: "About SOS Hardware & Glassmart",
    description: "Learn more about our hardware and glass services in Nyeri.",
    path: "/about",
    type: "article",
  },
  "/services": {
    title: "Hardware Supply Services | SOS Hardware & Glassmart",
    description: "Hardware supply, delivery and sourcing services in Kenya.",
    path: "/services",
    type: "website",
  },
  "/contact": {
    title: "Contact SOS Hardware & Glassmart",
    description: "Reach us for inquiries, orders and support.",
    path: "/contact",
    type: "website",
  },
};

// Templates
const PRODUCT_DETAIL_TEMPLATE: SeoConfig = {
  title: "Product Details | SOS Hardware & Glassmart",
  description: "View product details, pricing and availability.",
  path: "/products",
  type: "product",
};

const CATEGORY_TEMPLATE: SeoConfig = {
  title: "Hardware Category | SOS Hardware & Glassmart",
  description: "Browse hardware categories and supplies.",
  path: "/products",
  type: "website",
};

// Controlled noindex pages
const NOT_FOUND_CONFIG: SeoConfig = {
  title: "Page Not Found | SOS Hardware & Glassmart",
  description: "This page does not exist.",
  path: "/404",
  robots: "noindex, follow",
};

const ADMIN_CONFIG: SeoConfig = {
  title: "Admin Dashboard",
  description: "Admin panel",
  path: "/admin",
  robots: "noindex, nofollow",
};

const ensureMetaTag = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value);
  });

  return element;
};

const ensureCanonicalLink = () => {
  let canonical = document.head.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }

  return canonical;
};

// ✅ FIXED ROUTE LOGIC
const getSeoForPath = (pathname: string): SeoConfig => {
  const cleanPath = pathname.split("?")[0];

  if (cleanPath === "/404") return NOT_FOUND_CONFIG;
  if (cleanPath.startsWith("/admin")) return ADMIN_CONFIG;
  if (cleanPath.startsWith("/products/")) return PRODUCT_DETAIL_TEMPLATE;
  if (cleanPath.startsWith("/category/")) return CATEGORY_TEMPLATE;

  // ✅ fallback to homepage instead of 404
  return SEO_BY_ROUTE[cleanPath] || SEO_BY_ROUTE["/"];
};

export function SEO() {
  const location = useLocation();

  useEffect(() => {
    const seo = getSeoForPath(location.pathname);
    const canonicalUrl = `${SITE_URL}${seo.path === "/" ? "" : seo.path}`;

    document.title = seo.title;

    ensureMetaTag('meta[name="description"]', {
      name: "description",
      content: seo.description,
    });

    ensureMetaTag('meta[name="keywords"]', {
      name: "keywords",
      content: seo.keywords || "",
    });

    ensureMetaTag('meta[name="robots"]', {
      name: "robots",
      content: seo.robots || "index, follow",
    });

    ensureMetaTag('meta[property="og:title"]', {
      property: "og:title",
      content: seo.title,
    });

    ensureMetaTag('meta[property="og:description"]', {
      property: "og:description",
      content: seo.description,
    });

    ensureMetaTag('meta[property="og:type"]', {
      property: "og:type",
      content: seo.type || "website",
    });

    ensureMetaTag('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });

    ensureMetaTag('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: SITE_NAME,
    });

    ensureMetaTag('meta[property="og:image"]', {
      property: "og:image",
      content: DEFAULT_OG_IMAGE,
    });

    ensureMetaTag('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });

    ensureMetaTag('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: seo.title,
    });

    ensureMetaTag('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seo.description,
    });

    ensureMetaTag('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: DEFAULT_OG_IMAGE,
    });

    ensureCanonicalLink().href = canonicalUrl;
  }, [location.pathname]);

  return null;
}