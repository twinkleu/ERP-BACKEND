import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "../../../middlewares/accessRateLimiter";
import checkAccessKey from "../../../middlewares/checkAccessKey";
import checkAuth from "../../../middlewares/checkAuth";
import validation from "./../purchaseValidation";
 import controller from "./purchaseQuotationController";
 
router.post(
  `/create-Rfq`,
  accessRateLimiter,
  // checkAccessKey,
  // checkAuth.Admin,
  // validation.createRfq,
  controller.purchaseQuotation
);
 
// router.post(
//   `/inventory-detail/:product_id`,
//   accessRateLimiter,
//   checkAccessKey,
//   checkAuth.Admin,
//   validation.detail,
//   controller.detail
// );
 
// router.put(
//   `/manage-inventory`,
//   accessRateLimiter,
//   checkAccessKey,
//   checkAuth.Admin,
//   validation.manageInventory,
//   controller.manageInventory
// );
 
// router.post(
//   `/inventory-history-list`,
//   accessRateLimiter,
//   checkAccessKey,
//   checkAuth.Admin,
//   validation.inventoryHistorylist,
//   controller.inventoryHistorylist
// );
 
export default router;
