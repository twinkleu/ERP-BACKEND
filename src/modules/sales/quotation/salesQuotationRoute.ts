import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "../../../middlewares/accessRateLimiter";
import checkAccessKey from "../../../middlewares/checkAccessKey";
import checkAuth from "../../../middlewares/checkAuth";
// import validation from "./purchaseValidation";
//  import controller from "./purchaseController";
 
router.post(
  `/purchaseQuotation`,
  accessRateLimiter,
//   checkAccessKey,
//   checkAuth.Admin,
//   validation.createRfq,
//   controller.purchase
);
 