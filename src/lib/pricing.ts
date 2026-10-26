import type { Product } from "./product-types";

export const MAX_QTY = 10;

export function calcTotal(product: Pick<Product, "price" | "addon">, qty: number, withAddon: boolean): number {
  const q = Math.min(Math.max(Math.trunc(qty) || 1, 1), MAX_QTY);
  return product.price * q + (withAddon && product.addon ? product.addon.price : 0);
}
