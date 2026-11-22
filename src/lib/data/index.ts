/**
 * DATA ACCESS LAYER.
 * Every page reads through these functions. With Supabase configured they hit the database
 * (./supabase.ts, Row-Level Security applies); without keys they serve the built-in sample data
 * (./mock.ts) so the site still runs in demo mode. Same names, same return shapes.
 */
import { isSupabaseConfigured } from "@/lib/supabase/env";
import * as mock from "./mock";
import * as db from "./supabase";

export { SORTS, CURRENT_SELLER_ID } from "./mock";
export type { ProductQuery } from "./mock";

type AnyFn = (...args: never[]) => unknown;
function pick<K extends keyof typeof mock & keyof typeof db>(key: K): (typeof mock)[K] {
  return ((...args: unknown[]) =>
    ((isSupabaseConfigured() ? db[key] : mock[key]) as unknown as (...a: unknown[]) => unknown)(...args)) as unknown as (typeof mock)[K];
}
void (null as unknown as AnyFn);

export const queryProducts = pick("queryProducts");
export const getCategories = pick("getCategories");
export const getCategory = pick("getCategory");
export const getSubcategories = pick("getSubcategories");
export const getSubcategoryMap = pick("getSubcategoryMap");
export const getProduct = pick("getProduct");
export const getProductById = pick("getProductById");
export const getProductsByIds = pick("getProductsByIds");
export const getNewArrivals = pick("getNewArrivals");
export const getTrending = pick("getTrending");
export const getOnSale = pick("getOnSale");
export const getRelated = pick("getRelated");
export const getCollections = pick("getCollections");
export const getCollection = pick("getCollection");
export const getActiveSellers = pick("getActiveSellers");
export const getSellerBySlug = pick("getSellerBySlug");
export const getSellerById = pick("getSellerById");
export const getSellerNames = pick("getSellerNames");
export const getProductReviews = pick("getProductReviews");
export const ratingBreakdown = pick("ratingBreakdown");
export const getHomeBanners = pick("getHomeBanners");
export const getStripBanner = pick("getStripBanner");
export const getCoupon = pick("getCoupon");
export const getTrendingSearches = pick("getTrendingSearches");
export const getFollowState = pick("getFollowState");
export const getCurrentCustomer = pick("getCurrentCustomer");
export const getMyOrders = pick("getMyOrders");
export const getOrderByIdOrNumber = pick("getOrderByIdOrNumber");
export const getMyAddresses = pick("getMyAddresses");
export const getMyReturns = pick("getMyReturns");
export const getAdminDashboard = pick("getAdminDashboard");
export const getAllOrders = pick("getAllOrders");
export const getAllCustomers = pick("getAllCustomers");
export const getCustomerById = pick("getCustomerById");
export const getOrdersForCustomer = pick("getOrdersForCustomer");
export const getAllSellers = pick("getAllSellers");
export const getAllProducts = pick("getAllProducts");
export const getAllPayouts = pick("getAllPayouts");
export const getAllReturns = pick("getAllReturns");
export const getAllCoupons = pick("getAllCoupons");
export const getAllBanners = pick("getAllBanners");
export const getAllReviews = pick("getAllReviews");
export const getAnalytics = pick("getAnalytics");
export const getNotifications = pick("getNotifications");
export const resolveSellerId = pick("resolveSellerId");
export const getCurrentSeller = pick("getCurrentSeller");
export const getOrdersForSeller = pick("getOrdersForSeller");
export const getSellerDashboard = pick("getSellerDashboard");
export const getSellerProducts = pick("getSellerProducts");
export const getSellerPayouts = pick("getSellerPayouts");
export const getSellerReturns = pick("getSellerReturns");
export const getSellerReviews = pick("getSellerReviews");

export const getSettings = pick("getSettings");
export const getDealBox = pick("getDealBox");
export const getAddressesForCustomer = pick("getAddressesForCustomer");
export const getSellerPromotions = pick("getSellerPromotions");
export const getSellerTickets = pick("getSellerTickets");
export type { SettingsData, PromoRow, TicketRow } from "./mock";
