import { Schema, model } from "mongoose";
import constants from "../utils/constants";

const itemSchema = new Schema(
  {
    companyId: {
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
    status: {
      type: Number,
      required: true,
      enum: [
        constants.shippingStatus.pending,
        // constants.shippingStatus.onHold,
        // constants.shippingStatus.awaitingFulfillment,
        // constants.shippingStatus.awaitingShipment,
        // constants.shippingStatus.awaitingPickup,
        // constants.shippingStatus.partiallyShipped,
        // constants.shippingStatus.shipped,
        // constants.shippingStatus.completed,
        // constants.shippingStatus.cancelled,
        // constants.shippingStatus.declined,
        // constants.shippingStatus.refunded,
        // constants.shippingStatus.partiallyRefunded,
      ],
      default: constants.shippingStatus.pending,
    },
  },
  {
    timestamps: true,
  }
);

const orderSchema = new Schema(
  {
    paymentId: { type: Schema.Types.ObjectId, required: true, ref: "Payment" },
    orderId: { type: String, required: true, unique: true },
    orderType: {
      type: Number,
      required: true,
      // enum: [constants.orderType.self, constants.orderType.online],
    },
    orderDate: { type: Date, required: true, default: new Date() },
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
    status: {
      type: Number,
      required: true,
      enum: [
        constants.orderStatus.open,
        constants.orderStatus.pending,
        constants.orderStatus.processing,
        constants.orderStatus.completed,
      ],
      default: constants.orderStatus.open,
    },
    isDeleted: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Order = model("order", orderSchema);

export default Order;