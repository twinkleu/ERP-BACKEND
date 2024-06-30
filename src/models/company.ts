import { Schema, model } from "mongoose";
import constants from "../utils/constants";
import { unixTime } from "../helpers/helper";

const companySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contactPersonName: { type: String },
    slug: { type: String, required: true },
    reference_id: {
      type: String,
      required: true,
    },
    companyEmail: {
      value: { type: String,required: true},
      is_verified: { type: Boolean, default: false },
    },
    companyPhone: {
      value: { type: String,required: true },
      is_verified: { type: Boolean, required: true, default: false },
    },
    contactEmail: {
      value: { type: String },
      is_verified: { type: Boolean, default: false },
    },
    foundingYear: { type: String },
    contactPhone: {
      value: { type: String },
      is_verified: { type: Boolean, default: false },
    },
    industry: { type: String },
    year: { type: String },
    userId: { type: Schema.Types.ObjectId },
    tags: { type: Array },
    logo: { type: String },
    logoUrl: { type: String },
    buyerAndSupplier: { type: String, required: true,  enum: [
      constants.companyType.both,
      constants.companyType.buyer,
      constants.companyType.supplier
    ] },
    gst: {
      value: { type: String },
      is_verified: { type: Boolean, required: true, default: false },
    },
    isCompanyErp: { type: Boolean, required: true, default: false },
    about: { type: String },
    status: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);


companySchema.method("getCompanyDetail", async function getAuthDetail() {
  return {
    _id:this._id,
    companyEmail: this.companyEmail?.value,
    companyPhone: this.companyPhone?.value,
    name:this.name
  };
});

const Company = model("company", companySchema);

export default Company;
