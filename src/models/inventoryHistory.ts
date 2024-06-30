import { Schema, model } from "mongoose";
import constants from "../utils/constants";
const inventoryHistorySchema = new Schema(
    {
        transaction_id: { type: String, required: true, unique: true },
        type: {
            type: String,
            enum: [constants.historyType.Inventory, constants.historyType.StockTransfer],
            default: constants.historyType.Inventory
        },
        product: [{
            product_id: { type: Schema.Types.ObjectId, required: true },
            quantity: {
                previous: { type: Number, required: true },
                changed: { type: Number, required: true },
                new: { type: Number, required: true },
            },
            msl: {
                previous: { type: Number, required: true },
                changed: { type: Number, required: true },
                new: { type: Number, required: true },
            },
            price: { type: Number },
            currency: {
                type: String,
                required: true,
                default: "₹",
            },
        }],
        sourceLocation: {
            type: Schema.Types.ObjectId,
            ref: "Address",
            required: true,
        },
        destinationLocation: {
            type: Schema.Types.ObjectId,
            ref: "Address",
        },
        isDeleted: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
        deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

const InventoryHistory = model("InventoryHistory", inventoryHistorySchema);

export default InventoryHistory;
