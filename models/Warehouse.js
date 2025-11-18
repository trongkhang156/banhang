import mongoose from "mongoose";

const WarehouseSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  stock: { type: Number, default: 0 },
});

export default mongoose.model("Warehouse", WarehouseSchema);
