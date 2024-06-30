import { Schema, model } from "mongoose";
import constants from "../utils/constants";

const bankSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    branch_name: {
      type: String,
      required: true,
    },
    ifsc: {
      type: String,
      required: true,
    },
    account_name: {
      type: String,
      required: true,
    },
    account_no: {
      value: { type: String, required: true },
      is_verified: { type: Boolean, required: true, default: false },
    },
    account_type: {
      type: String,
      required: true,
      enum: [
        constants.bankAccountTypes.saving,
        constants.bankAccountTypes.current,
      ],
    },
    status: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Bank = model("bank", bankSchema);

export default Bank;
