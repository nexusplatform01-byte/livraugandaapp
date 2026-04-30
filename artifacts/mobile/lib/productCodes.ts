/**
 * Maps the mobile UI's provider IDs to the actual Relworx product codes
 * exposed by the Railway backend at /api/products.
 */

export type ProductCategory =
  | "AIRTIME"
  | "INTERNET"
  | "VOICE"
  | "TV"
  | "UTILITIES"
  | "BANK_TRANSFERS";

// Telco airtime: no price list, user enters amount. product_code is the code.
export const AIRTIME_CODES: Record<string, string> = {
  mtn:    "MTN_UG_AIRTIME",
  airtel: "AIRTEL_UG_AIRTIME",
  utl:    "UTL_AIRTIME",
};

// Internet (data) bundles: has_price_list=true. UI lets user pick a bundle.
export const INTERNET_CODES: Record<string, string> = {
  mtn:    "MTN_UG_INTERNET",
  airtel: "AIRTEL_UG_INTERNET",
  roke:   "ROKE_TELECOM_UG_INTERNET",
};

// Voice (talk-time) bundles: has_price_list=true.
export const VOICE_CODES: Record<string, string> = {
  mtn:    "MTN_UG_VOICE_BUNDLES",
  airtel: "AIRTEL_UG_VOICE_BUNDLES",
};

// TV / Pay TV providers: has_price_list=true (bouquet bundles).
export const TV_CODES: Record<string, string> = {
  dstv:        "DSTV",
  gotv:        "GO_TV",
  startimes:   "STARTIMES",
  azam:        "AZAM_TV",
  multichoice: "MULTICHOICE",
};

// Utilities (electricity / water).
export const UTILITY_CODES: Record<string, string> = {
  umeme_prepaid:  "UMEME_PRE_PAID",
  umeme_postpaid: "UMEME_POST_PAID",
  nwsc:           "NATIONAL_WATER",
};

// Whether a given utility/account-bound product needs a service-area choice.
export function requiresLocation(productCode: string | null | undefined): boolean {
  return productCode === "NATIONAL_WATER";
}

// UI Bank ID -> Relworx bank-transfer product code.
export const BANK_TRANSFER_CODES: Record<string, string> = {
  stanbic:    "STANBIC_BANK_UGANDA_TRANSFER",
  absa:       "ABSA_BANK_UGANDA_TRANSFER",
  centenary:  "CENTENARY_RURAL_DEVELOPMENT_BANK_UGANDA_TRANSFER",
  dfcu:       "DFCU_BANK_UGANDA_TRANSFER",
  equity:     "EQUITY_BANK_UGANDA_TRANSFER",
  housing:    "HOUSING_FINANCE_BANK_UGANDA_TRANSFER",
  kcb:        "KCB_BANK_UGANDA_TRANSFER",
  ncba:       "NCBA_BANK_UGANDA_TRANSFER",
  postbank:   "POSTBANK_UGANDA_TRANSFER",
  pride:      "FINANCE_TRUST_BANK_UGANDA_TRANSFER",
  tropical:   "TROPICAL_BANK_UGANDA_TRANSFER",
  uba:        "UNITED_BANK_FOR_AFRICA_TRANSFER",
  oci:        "ORIENT_BANK_UGANDA_TRANSFER",
  exim:       "EXIM_BANK_UGANDA_TRANSFER",
  ecobank:    "ECOBANK_UGANDA_TRANSFER",
  diamond:    "DIAMOND_TRUST_BANK_UGANDA_TRANSFER",
  baroda:     "BANK_OF_BARODA_UGANDA_TRANSFER",
  india:      "BANK_OF_INDIA_UGANDA_TRANSFER",
  africa:     "BANK_OF_AFRICA_UGANDA_TRANSFER",
  citi:       "CITIBANK_UGANDA_TRANSFER",
  guaranty:   "GUARANTY_TRUST_BANK_UGANDA_TRANSFER",
  abc:        "ABC_CAPITAL_BANK_UGANDA_TRANSFER",
  cairo:      "CAIRO_INTERNATIONAL_BANK_UGANDA_TRANSFER",
  opportunity:"OPPORTUNITY_BANK_UGANDA_TRANSFER",
  topfinance: "TOP_FINANCE_BANK_UGANDA_TRANSFER",
  standard:   "STANDARD_CHARTERED_BANK_UGANDA_TRANSFER",
};
