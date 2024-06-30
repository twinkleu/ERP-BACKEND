import { Schema, model } from "mongoose";

const inventorySchema = new Schema(
  {
    company_Id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    msl:{type:Number, required:true,default:0},
    quantity: { type: Number, required: true, default: 0 },
    sold: { type: Number, required: true, default: 0 },
    isDeleted: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Inventory = model("inventory", inventorySchema);

export default Inventory;
