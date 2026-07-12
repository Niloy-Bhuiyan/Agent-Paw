/** Central site configuration — prices, links, socials. */
export const site = {
  name: "COMNYANG",
  basePrice: 3.9,
  coffeePrice: 1.9,
  priceTag: "LAUNCH",
  socials: [
    { label: "INSTAGRAM", href: "https://www.instagram.com/com.nyang" },
    { label: "THREADS", href: "https://www.threads.com/@com.nyang" },
    { label: "X", href: "https://x.com/Com_nyang" },
  ],
  legal: [
    { key: "footer.terms", href: "#" },
    { key: "footer.privacy", href: "#" },
    { key: "footer.refund", href: "#" },
  ],
} as const;

export const formatPrice = (value: number): string => `$${value.toFixed(2)}`;
