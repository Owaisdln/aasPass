import { describe, expect, it } from "vitest";
import { applyStockChange, formatINR, nextOrderStatuses, validatePrice } from "./rules";

describe("vendor rules", () => {
  it("formats money in rupees with two decimals", () => {
    expect(formatINR(1234.5)).toBe("₹1,234.50");
  });
  it("rejects selling price above MRP", () => {
    expect(validatePrice(50, 60)).not.toBeNull();
    expect(validatePrice(50, 45)).toBeNull();
  });
  it("restock adds and damage removes stock", () => {
    expect(applyStockChange(10, 0, "RESTOCK", 5)).toEqual({ stock: 15 });
    expect(applyStockChange(10, 0, "DAMAGE", 3)).toEqual({ stock: 7 });
  });
  it("stock cannot go below zero or below reserved", () => {
    expect(applyStockChange(2, 0, "SALE", 3)).toHaveProperty("error");
    expect(applyStockChange(5, 4, "EXPIRED", 2)).toHaveProperty("error");
  });
  it("pickup orders go to ready-for-pickup, delivery orders go out for delivery", () => {
    expect(nextOrderStatuses("PREPARING", "PICKUP")).toEqual(["READY_FOR_PICKUP"]);
    expect(nextOrderStatuses("PREPARING", "DELIVERY")).toEqual(["OUT_FOR_DELIVERY"]);
  });
  it("only new or accepted orders can be rejected", () => {
    expect(nextOrderStatuses("PENDING", "DELIVERY")).toContain("CANCELLED");
    expect(nextOrderStatuses("PREPARING", "DELIVERY")).not.toContain("CANCELLED");
    expect(nextOrderStatuses("DELIVERED", "DELIVERY")).toEqual([]);
  });
});
