import { Schema, model } from "mongoose";
import constants from "../utils/constants";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String
    },
    batchNumber:{
      type: String
    },
    productCode:{
      type: String
    },
    Type:{type:String,enum:[constants.productType.core,constants.productType.produced],required:true},
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      // required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      // required: true,
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      enum:[null,Schema.Types.ObjectId],
      ref: "SubCategory",
      // required: true,
    },
    subChildCategoryId: {
      type: Schema.Types.ObjectId,
      enum:[null,Schema.Types.ObjectId],
      ref: "SubChildCategory",
      // required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    colorId: {
      type: Schema.Types.ObjectId,
      enum:[null,Schema.Types.ObjectId],
      ref: "Color",
      // required: true,
    },
    paintType: {
      type: Schema.Types.ObjectId,
      ref: "painttype",
    },
    finish: {
      type: Schema.Types.ObjectId,
      ref: "finishtype",
    },
   QuantityToProduce: { type: Number, required: true, default: 0 },
    sold: { type: Number, required: true, default: 0 },
    sellingPrice: {
      type: String,
      required: true,
    },
    costPrice: {
      type: String,
      required: true,
    },
    unitPrice: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "₹",
    },
    GST: {
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
    manufacturedDate: {
      type: Date,
      // required: true,
    },
    region: {
      type: String,
      required: true,
      default: "India",
    },
    HSN: {
      type: Schema.Types.ObjectId,
      ref: "HSN",
      // required: true,
    },
    weight: {
      value: {
        type: Schema.Types.Decimal128,
        required: true,
      },
      unit: {
        type: Schema.Types.ObjectId,
        ref: "uom",
      },
    },
    base_paint_one: {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "product",
      },
      weight: {
        value: {
          type: Schema.Types.Decimal128,
        },
        unit: {
          type: Schema.Types.ObjectId,
          ref: "uom",
        },
      },
    },
    base_paint_two: {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "product",
      },
      weight: {
        value: {
          type: Schema.Types.Decimal128,

        },
        unit: {
          type: Schema.Types.ObjectId,
          ref: "uom",
        },
      },
    },
    tinters: [
      {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "product",
      },
      weight: {
        value: {
          type: Schema.Types.Decimal128,

        },
        unit: {
          type: Schema.Types.ObjectId,
          ref: "uom",
        },
      },
    }
  ],
    // is_verified: {
    //   type: Boolean,
    //   required: true,
    // },
    // sell_online: {
    //   type: Boolean,
    //   default: false,
    //   required: true,
    // },
    soldBy: {type:Schema.Types.ObjectId, ref: "User",required:true},
    status: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);



productSchema.method("getProductDetail", async function getAuthDetail() {
  return {
    name: this.name,
    sku: this.sku,
    productCode: this.productCode,
    weight:this.weight
  };
});

const Product = model("product", productSchema);

export default Product;