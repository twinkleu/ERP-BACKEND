import { Schema, model } from "mongoose";
import constants from "../utils/constants";

const itemSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    mrp: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 0 },
    gst: {
      type: Number,
      required: true,
      enum: [
        constants.gstPercentage.none,
        constants.gstPercentage.fivePercent,
        constants.gstPercentage.twelvePercent,
        constants.gstPercentage.eighteenPercent,
        constants.gstPercentage.twentyEightPercent,
      ],
    },
    total: { type: Number, required: true, default: 0 },
    subTotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    discountPercent: { type: Number, required: true, default: 0 },
    taxableAmount: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    netAmount: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

const invoiceSchema = new Schema(
  {
    invoiceId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    invoiceDate: { type: Date, required: true, default: new Date() },
    sellerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
    },
    billingAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
    },
    items: [itemSchema],
    totalItem: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    subTotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    taxableAmount: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "₹" },
    file: { type: String },
    fileUrl: { type: String },
    isDeleted: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Invoice = model("invoice", invoiceSchema);

export default Invoice;
