import { NextFunction, Response } from "express";
import Quotation from "../../../models/quotation";
import constants from "../../../utils/constants";
import { generateDocumentNumber, randomToken } from "../../../helpers/helper";
import mongoose, { mongo } from "mongoose";
import message from "../../purchase/purchaseConstants";
import Company from "../../../models/company";
import sendMail from "../../../helpers/mail";
const purchaseQuotation = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      // documentNumber,
      type,
      requested,
      received,
      billingAddressId,
      shippingAddressId,
      biddingStartDate,
      biddingEndDate,
      paymentTerm,
      status,
      createdBy,
    } = req.body;

    const formatRequested: any = [];
    for (const company of requested) {
      const items: any = [];
      for (const item of company.items) {
        items.push({
          ...item,
          productId: new mongoose.Types.ObjectId(item.productId),
          weight: {
            ...item.weight,
            unit: new mongoose.Types.ObjectId(item.weight.unit),
          },
        });
      }
      formatRequested.push({
        companyId: new mongoose.Types.ObjectId(company.companyId),
        items: items,
        verifyToken: await randomToken(),
      });
    }
    // Create and save a new quotation
    const newQuotation = new Quotation({
      documentNumber:generateDocumentNumber(),
      type,
      requested: formatRequested,
      //   received: convertedReceived,
      billingAddressId: new mongoose.Types.ObjectId(billingAddressId),
      shippingAddressId: new mongoose.Types.ObjectId(shippingAddressId),
      biddingStartDate,
      biddingEndDate,
      paymentTerm,
      status,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      // updatedBy: new mongoose.Types.ObjectId(updatedBy),
      // deletedBy: new mongoose.Types.ObjectId(deletedBy),
    });

    const generateURL = (
      companyId: mongoose.Types.ObjectId,
      items: any[],
      biddingStartDate: string,
      biddingEndDate: string,
      verifyToken: string,
    ): string => {
      const baseURL =`${process.env.Host}/quotation`;
      const params = new URLSearchParams({
        companyId: companyId.toHexString(),
        items: JSON.stringify(items),
        biddingStartDate,
        biddingEndDate,
        verifyToken,
      });

      return `${baseURL}?${params.toString()}`;
    };

    for (let i = 0; i < formatRequested.length; i++) {
      Company.find({
        _id: formatRequested[i].companyId,
        isDeleted: false,
      }).then(async (companyDetail: any) => {
        if (companyDetail.length<0) {
          throw {
            statusCode: constants.code.preconditionFailed,
            message: `Company Not Found`,
          };
        } else {
          //inside urls, data we need
          //1)-companyId
          //2)-items,
          //3)-biddingStartDate
          //4)-biddingEndDate
          //5)-verificationtoken
          //6)-
          let url: any = generateURL(
            formatRequested[i].companyId,

            formatRequested[i].items,
            biddingStartDate,
            biddingEndDate,
            formatRequested[i].verifyToken,
          );
          const payload = {
            // to: companyDetail[i]?.companyEmail?.value,
            to:["prateekmishra10007@gmail.com"],
            title: constants.emailTitle.purchaseQuotation,
            data: url,
          };

          await sendMail(payload);
        }
      });
    }

    await newQuotation.save();

    res.status(constants.code.success).json({
      message: constants.message.success,
      userStatus:req.status,
      // status:constants
      status:constants.status.statusTrue
    });
  } catch (error) {
    res.status(constants.code.preconditionFailed).json({
      message: error,
    });
  }
};



export default { purchaseQuotation };
