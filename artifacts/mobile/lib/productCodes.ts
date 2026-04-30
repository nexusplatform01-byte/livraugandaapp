/**
 * Maps the mobile UI's category + provider selection to the
 * Relworx `product_code` expected by /api/products/validate.
 *
 * Codes are based on Relworx's published product catalog. If a
 * provider isn't supported by Relworx, the entry is left null and
 * the UI surfaces a friendly "not supported" message.
 */

export type BuyCat = "airtime" | "voice" | "data";
export type BuyProv = "mtn" | "airtel";

export type PayCat = "tv" | "electricity" | "water";

/** Buy: airtime / voice / data bundle product codes. */
export const BUY_PRODUCT_CODES: Record<BuyCat, Record<BuyProv, string | null>> =
  {
    airtime: {
      mtn: "MTN_UG_AIRTIME",
      airtel: "AIRTEL_UG_AIRTIME",
    },
    // Relworx exposes data bundles via airtime top-up + USSD activation.
    // We submit airtime so the wallet is credited; the user activates
    // their bundle via the operator's standard USSD code.
    voice: {
      mtn: "MTN_UG_AIRTIME",
      airtel: "AIRTEL_UG_AIRTIME",
    },
    data: {
      mtn: "MTN_UG_AIRTIME",
      airtel: "AIRTEL_UG_AIRTIME",
    },
  };

/** Pay: utility & TV product codes keyed by provider id used in pay.tsx. */
export const PAY_PRODUCT_CODES: Record<string, string | null> = {
  // Electricity
  umeme: "UMEME",
  wenreco: null,
  ferdsult: null,

  // Water
  nwsc: "NATIONAL_WATER",
  umbrella: null,

  // TV / Cable
  dstv: "DSTV",
  gotv: "GOTV",
  startimes: "STARTIMES_TV",
  showmax: "SHOWMAX",
};

/** Whether this provider needs a `location_id` (from Relworx choice-list). */
export function requiresLocation(productCode: string | null): boolean {
  return productCode === "NATIONAL_WATER";
}
