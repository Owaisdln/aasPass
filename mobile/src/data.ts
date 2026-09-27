import type { PaymentMethod, Product, Store } from "./model";

export const logoMark = require("../assets/aaspass-mark.png");

export const stores: Store[] = [];
export const products: Product[] = [];

export const paymentMethods: PaymentMethod[] = [
  { id: "cod", label: "Cash on delivery", detail: "Pay the delivery partner when your order arrives", available: true },
  { id: "upi", label: "UPI", detail: "Google Pay, PhonePe, Paytm and more", available: true },
  { id: "card", label: "Credit / debit card", detail: "Visa, Mastercard, RuPay", available: true },
  { id: "netbanking", label: "Net banking", detail: "All major Indian banks", available: true },
  { id: "wallet", label: "Wallets", detail: "Paytm, Amazon Pay and more", available: true },
];

export const upiApps = ["Google Pay", "PhonePe", "Paytm", "BHIM"];
export const netBankingBanks = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Punjab National Bank"];
export const walletOptions = ["Paytm Wallet", "Amazon Pay", "Mobikwik"];

export const getStore = (id: string) => stores.find((store) => store.id === id);
export const getProduct = (id: string) => products.find((product) => product.id === id);

export const replaceCatalogData = (nextStores: Store[], nextProducts: Product[]) => {
  stores.splice(0, stores.length, ...nextStores);
  products.splice(0, products.length, ...nextProducts);
};