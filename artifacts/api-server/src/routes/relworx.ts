import { Router, type IRouter, type Request, type Response } from "express";
import { relworx, generateReference } from "../lib/relworx";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function handleError(res: Response, err: unknown) {
  const message =
    err instanceof Error ? err.message : "Unexpected server error.";
  logger.error({ err }, "Relworx route error");
  res.status(500).json({ success: false, message });
}

function send<T extends { success?: boolean }>(
  res: Response,
  result: { ok: boolean; status: number; data: T },
) {
  if (!result.ok || result.data?.success === false) {
    return res.status(result.status || 502).json(result.data);
  }
  return res.json(result.data);
}

// GET /api/relworx/products/choice-list?code=NATIONAL_WATER
router.get("/products/choice-list", async (req: Request, res: Response) => {
  const code = String(req.query["code"] ?? "");
  if (!code) {
    return res
      .status(400)
      .json({ success: false, message: "code query param is required." });
  }
  try {
    const result = await relworx.choiceList(code);
    return send(res, result);
  } catch (err) {
    return handleError(res, err);
  }
});

// POST /api/relworx/products/validate
// body: { msisdn, amount, product_code, contact_phone, location_id? }
router.post("/products/validate", async (req: Request, res: Response) => {
  const { msisdn, amount, product_code, contact_phone, location_id } =
    req.body ?? {};
  if (!msisdn || !amount || !product_code || !contact_phone) {
    return res.status(400).json({
      success: false,
      message:
        "msisdn, amount, product_code and contact_phone are required.",
    });
  }
  try {
    const result = await relworx.validateProduct({
      reference: generateReference(),
      msisdn: String(msisdn),
      amount: Number(amount),
      product_code: String(product_code),
      contact_phone: String(contact_phone),
      ...(location_id ? { location_id: String(location_id) } : {}),
    });
    return send(res, result);
  } catch (err) {
    return handleError(res, err);
  }
});

// POST /api/relworx/products/purchase
// body: { validation_reference }
router.post("/products/purchase", async (req: Request, res: Response) => {
  const { validation_reference } = req.body ?? {};
  if (!validation_reference) {
    return res.status(400).json({
      success: false,
      message: "validation_reference is required.",
    });
  }
  try {
    const result = await relworx.purchaseProduct({
      validation_reference: String(validation_reference),
    });
    return send(res, result);
  } catch (err) {
    return handleError(res, err);
  }
});

// POST /api/relworx/mobile-money/validate
// body: { msisdn }
router.post(
  "/mobile-money/validate",
  async (req: Request, res: Response) => {
    const { msisdn } = req.body ?? {};
    if (!msisdn) {
      return res
        .status(400)
        .json({ success: false, message: "msisdn is required." });
    }
    try {
      const result = await relworx.validateMobileNumber(String(msisdn));
      return send(res, result);
    } catch (err) {
      return handleError(res, err);
    }
  },
);

// POST /api/relworx/mobile-money/send-payment
// body: { msisdn, currency, amount, description? }
router.post(
  "/mobile-money/send-payment",
  async (req: Request, res: Response) => {
    const { msisdn, currency, amount, description } = req.body ?? {};
    if (!msisdn || !currency || !amount) {
      return res.status(400).json({
        success: false,
        message: "msisdn, currency and amount are required.",
      });
    }
    try {
      const result = await relworx.sendPayment({
        reference: generateReference(),
        msisdn: String(msisdn),
        currency: String(currency),
        amount: Number(amount),
        ...(description ? { description: String(description) } : {}),
      });
      return send(res, result);
    } catch (err) {
      return handleError(res, err);
    }
  },
);

// GET /api/relworx/mobile-money/wallet-balance?currency=UGX
router.get(
  "/mobile-money/wallet-balance",
  async (req: Request, res: Response) => {
    const currency = String(req.query["currency"] ?? "UGX");
    try {
      const result = await relworx.checkWalletBalance(currency);
      return send(res, result);
    } catch (err) {
      return handleError(res, err);
    }
  },
);

// GET /api/relworx/request-status?internal_reference=...
router.get("/request-status", async (req: Request, res: Response) => {
  const ref = String(req.query["internal_reference"] ?? "");
  if (!ref) {
    return res.status(400).json({
      success: false,
      message: "internal_reference query param is required.",
    });
  }
  try {
    const result = await relworx.checkRequestStatus(ref);
    return send(res, result);
  } catch (err) {
    return handleError(res, err);
  }
});

// GET /api/relworx/transactions
router.get("/transactions", async (_req: Request, res: Response) => {
  try {
    const result = await relworx.transactions();
    return send(res, result);
  } catch (err) {
    return handleError(res, err);
  }
});

export default router;
