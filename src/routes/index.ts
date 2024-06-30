import constants from "../utils/constants";
import adminRoute from "../modules/admin/adminRoute";
import adminHomeRoute from "../modules/admin/home/homeRoute";
import adminUserRoute from "../modules/admin/user/userRoute";
import adminEmailRoute from "../modules/admin/email/emailRoute";
import adminSMSRoute from "../modules/admin/sms/smsRoute";
import adminCMSRoute from "../modules/admin/cms/cmsRoute";
import companyRoute from "../modules/admin/company/companyRoute";
import publicRoute from "../modules/public/publicRoute";
// import adminFeedbackRoute from "../modules/admin/feedback/feedbackRoute";
import addressRoute from "../modules/admin/address/addressRoute";

import adminSettingRoute from "../modules/admin/setting/settingRoute";
import departmentRoute from "../modules/admin/department/departmentRoute";
import catalougeRoute from "../modules/admin/catalouge/catalougeRoute";
import commentRoute from "../modules/admin/comment/commentRoute";
import productRoute from "../modules/admin/product/productRoute";
import inventoryRoute from "../modules/inventory/inventoryRoute";
import stockMovementRoute from "../modules/inventory/stockMovement/stockMovementRoute"
import purchaseQuotationRoute from "../modules/purchase/quotation/purchaseQuotationRoute"
import purchaseRoute from "../modules/purchase/purchaseRoute"
import salesRoute from "../modules/sales/salesRoute"
export default (app: any) => {
  //Public
  app.use(`/api/public`, publicRoute);
  //Admin

  app.use(`/api/admin/address`, addressRoute);
  app.use(`/api/admin`, adminRoute);
  app.use(`/api/admin/home`, adminHomeRoute);
  app.use(`/api/admin/user`, adminUserRoute);
  app.use(`/api/admin/email`, adminEmailRoute);
  app.use(`/api/admin/sms`, adminSMSRoute);
  app.use(`/api/admin/cms`, adminCMSRoute);
  app.use(`/api/admin/company`, companyRoute),
    app.use(`/api/admin/setting`, adminSettingRoute);
  app.use(`/api/admin/department`, departmentRoute);
  app.use(`/api/admin/comment`, commentRoute);
  app.use(`/api/admin/catalouge`, catalougeRoute);
  app.use(`/api/admin/product`, productRoute);

 app.use(`/api/inventory` , inventoryRoute)
 app.use(`/api/inventory/stockMovement` , stockMovementRoute)

 //purchase 
 app.use(`/api/purchase/purchaseQuotation` , purchaseQuotationRoute)
 app.use(`/api/purchase`,purchaseRoute)

 //sales
//  app.use(`/api/sales/salesQuotation` , purchaseQuotationRoute)
 app.use(`/api/sales`,salesRoute)

  //   app.use(`/api/admin/feedback`, adminFeedbackRoute);

  //   app.use(`/api/admin/catalouge`, adminCatalougeRoute);

  //User
  //   app.use(`/api/user`, userRoute);
  //   app.use(`/api/user/home`, userHomeRoute);
  // app.use(`/api/user/address`, userAddressRoute);
  //   app.use(`/api/user/wishlist`, userWishlistRoute);
  //   app.use(`/api/user/vehicle`, userVehicleRoute);

  app.use(`*`, (req: any, res: any) => {
    res.status(constants.code.badRequest).json({
      status: constants.status.statusFalse,
      userStatus: constants.status.statusFalse,
      message: constants.message.badRequest,
    });
  });
};
