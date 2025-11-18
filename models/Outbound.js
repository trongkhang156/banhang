import mongoose from "mongoose";

const OutboundSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Outbound", OutboundSchema);
