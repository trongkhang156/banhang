import 'dotenv/config'; // đọc .env
import express from "express";
import mongoose from "mongoose";
import path from "path";

import Product from "./models/Product.js";
import Warehouse from "./models/Warehouse.js";
import Inbound from "./models/Inbound.js";
import Outbound from "./models/Outbound.js";

const __dirname = path.resolve();
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- MongoDB ---
console.log("MONGO_URI =", process.env.MONGO_URI); // debug
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB error:", err));

//
// ------------------ PRODUCTS ------------------
app.get("/api/products", async (req, res) => {
  const data = await Product.find();
  res.json(data);
});

app.post("/api/products", async (req, res) => {
  try {
    const { name, price, description } = req.body;
    if (!name || !price) return res.status(400).json({ error: "Tên và giá là bắt buộc" });

    const product = new Product({ name, price, description });
    await product.save();

    // Tạo kho mặc định
    await new Warehouse({ productId: product._id, stock: 0 }).save();

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

//
// ------------------ WAREHOUSE ------------------
app.get("/api/warehouse", async (req, res) => {
  const data = await Warehouse.find().populate("productId");
  res.json(data);
});

//
// ------------------ INBOUND ------------------
app.get("/api/inbound", async (req, res) => {
  const data = await Inbound.find().populate("items.productId");
  res.json(data);
});

app.post("/api/inbound", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Items required" });

    const inbound = new Inbound({ items });
    await inbound.save();

    for (const item of items) {
      await Warehouse.findOneAndUpdate(
        { productId: item.productId },
        { $inc: { stock: item.quantity } }
      );
    }

    res.status(201).json(inbound);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

app.delete("/api/inbound/:id", async (req, res) => {
  try {
    const inbound = await Inbound.findById(req.params.id);
    if (!inbound) return res.status(404).json({ message: "Not found" });

    for (const item of inbound.items) {
      await Warehouse.findOneAndUpdate(
        { productId: item.productId },
        { $inc: { stock: -item.quantity } }
      );
    }

    await inbound.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

//
// ------------------ OUTBOUND ------------------
app.get("/api/outbound", async (req, res) => {
  const data = await Outbound.find().populate("items.productId");
  res.json(data);
});

app.post("/api/outbound", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Items required" });

    for (const item of items) {
      const wh = await Warehouse.findOne({ productId: item.productId });
      if (!wh || wh.stock < item.quantity)
        return res.status(400).json({ error: `Sản phẩm ${item.productId} vượt tồn kho` });
    }

    const outbound = new Outbound({ items });
    await outbound.save();

    for (const item of items) {
      await Warehouse.findOneAndUpdate(
        { productId: item.productId },
        { $inc: { stock: -item.quantity } }
      );
    }

    res.status(201).json(outbound);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

app.delete("/api/outbound/:id", async (req, res) => {
  try {
    const outbound = await Outbound.findById(req.params.id);
    if (!outbound) return res.status(404).json({ message: "Not found" });

    for (const item of outbound.items) {
      await Warehouse.findOneAndUpdate(
        { productId: item.productId },
        { $inc: { stock: item.quantity } }
      );
    }

    await outbound.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

//
// ------------------ SPA fallback ------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
