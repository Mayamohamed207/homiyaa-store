const fbq = (...args: any[]) => {
  try {
    (window as any).fbq?.(...args);
  } catch {
  }
};

export const trackPageView = () => fbq("track", "PageView");

export const trackViewContent = (id: string | number, name: string, price: number) =>
  fbq("track", "ViewContent", {
    content_ids: [String(id)],
    content_name: name,
    content_type: "product",
    value: price,
    currency: "EGP",
  });

export const trackAddToCart = (id: string | number, name: string, price: number, qty = 1) =>
  fbq("track", "AddToCart", {
    content_ids: [String(id)],
    content_name: name,
    content_type: "product",
    value: price * qty,
    currency: "EGP",
  });

export const trackInitiateCheckout = (value: number, ids: (string | number)[], numItems: number) =>
  fbq("track", "InitiateCheckout", {
    content_ids: ids.map(String),
    content_type: "product",
    value,
    currency: "EGP",
    num_items: numItems,
  });

export const trackPurchase = (value: number, ids: (string | number)[], orderId?: string) =>
  fbq(
    "track",
    "Purchase",
    {
      content_ids: ids.map(String),
      content_type: "product",
      value,
      currency: "EGP",
    },
    orderId ? { eventID: orderId } : undefined
  );