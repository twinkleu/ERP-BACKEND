
import { Schema, model } from "mongoose";
import constants from "../utils/constants";

const quotationItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  weight: {
    value: {
      type: Schema.Types.Decimal128,
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "uom",
    },
  },
  unitPrice: { type: Number, default: 0 },
  deliveryDate:{type:Date,required:true},
  // price: { type: Number, default: 0 },
  hsn: { type: String, required: true },
  comments: { type: String, required: true },
  GST: { type: Number, required: true },
}, { _id: false });

const quotationRequestSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [quotationItemSchema],
  verifyToken:{type:String},
}, { _id: false });

const quotationResponseSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [quotationItemSchema],
}, { _id: false });

const quotationSchema = new Schema({
  documentNumber: { type: String, required: true },
  type: { type: String, required: true, enum: [constants.quotationType.purchase, constants.quotationType.sales] },
  requested: [quotationRequestSchema],
  received: [quotationResponseSchema],
  billingAddressId: { type: Schema.Types.ObjectId, ref: "Address", required: true },
  shippingAddressId: { type: Schema.Types.ObjectId, ref: "Address", required: true },
  biddingStartDate: { type: Date, required:true },
  biddingEndDate: { type: Date , required:true},
  paymentTerm: { type: String, enum: [constants.paymentTerm.Net30, constants.paymentTerm.Net60, constants.paymentTerm.Net7, constants.paymentTerm.COD, constants.paymentTerm.PartialPayment] },
  status: { type: String, enum: [constants.quotationStatus.accepted, constants.quotationStatus.rejected, constants.quotationStatus.pending], default: constants.quotationStatus.pending },
  isDeleted: { type: Boolean, required: true, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const Quotation = model("Quotation", quotationSchema);

export default Quotation;
