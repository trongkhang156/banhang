import mongoose from "mongoose";

const InboundSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Inbound", InboundSchema);
