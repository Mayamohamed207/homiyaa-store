const fbq = (...args: any[]) => {
  try {
    (window as any).fbq?.(...args);
  } catch {
    /* never let tracking break the site */
  }
};

const CURRENCY = "EGP";

export interface PixelItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
}

const toContents = (items: PixelItem[]) =>
  items.map(i => ({
    id: String(i.id),
    quantity: i.quantity,
    item_price: i.price,
  }));

const toIds = (items: PixelItem[]) => items.map(i => String(i.id));
const toNames = (items: PixelItem[]) => items.map(i => i.name).join(", ");
const toCount = (items: PixelItem[]) => items.reduce((n, i) => n + i.quantity, 0);

export const trackPageView = () => fbq("track", "PageView");

export const trackViewContent = (
  id: string | number,
  name: string,
  price: number,
  category?: string
) =>
  fbq("track", "ViewContent", {
    content_ids: [String(id)],
    content_name: name,
    content_category: category,
    content_type: "product",
    contents: [{ id: String(id), quantity: 1, item_price: price }],
    value: price,
    currency: CURRENCY,
  });

export const trackAddToCart = (
  id: string | number,
  name: string,
  price: number,
  qty = 1
) =>
  fbq("track", "AddToCart", {
    content_ids: [String(id)],
    content_name: name,
    content_type: "product",
    contents: [{ id: String(id), quantity: qty, item_price: price }],
    value: price * qty,
    currency: CURRENCY,
  });

export const trackInitiateCheckout = (items: PixelItem[], value: number) =>
  fbq("track", "InitiateCheckout", {
    content_ids: toIds(items),
    content_name: toNames(items),
    content_type: "product",
    contents: toContents(items),
    num_items: toCount(items),
    value,
    currency: CURRENCY,
  });

export const trackPurchase = (
  items: PixelItem[],
  value: number,
  orderId?: string
) =>
  fbq(
    "track",
    "Purchase",
    {
      content_ids: toIds(items),
      content_name: toNames(items),
      content_type: "product",
      contents: toContents(items),
      num_items: toCount(items),
      value,
      currency: CURRENCY,
    },
    orderId ? { eventID: orderId } : undefined
  );