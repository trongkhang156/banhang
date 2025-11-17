require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const Product = require('./models/Product');
const Inbound = require('./models/Inbound');
const Outbound = require('./models/Outbound'); // Tạo model Outbound giống Inbound

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// =======================
// PRODUCT APIs
// =======================
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Update failed' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Delete failed' });
  }
});

// =======================
// INBOUND APIs
// =======================
app.get('/api/inbound', async (req, res) => {
  try {
    const inbounds = await Inbound.find()
      .populate('productId', 'name price')
      .sort({ date: -1 });
    res.json(inbounds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inbound', async (req, res) => {
  try {
    const { productId, quantity, date } = req.body;
    if (!productId || !quantity || !date)
      return res.status(400).json({ error: 'Missing fields' });

    const inbound = new Inbound({ productId, quantity, date: date.toString() });
    await inbound.save();
    await inbound.populate('productId', 'name price');
    res.status(201).json(inbound);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inbound/:id', async (req, res) => {
  try {
    await Inbound.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// OUTBOUND APIs
// =======================
app.get('/api/outbound', async (req, res) => {
  try {
    const outbounds = await Outbound.find()
      .populate('productId', 'name price')
      .sort({ date: -1 });
    res.json(outbounds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/outbound', async (req, res) => {
  try {
    const { productId, quantity, date } = req.body;
    if (!productId || !quantity || !date)
      return res.status(400).json({ error: 'Missing fields' });

    const outbound = new Outbound({ productId, quantity, date: date.toString() });
    await outbound.save();
    await outbound.populate('productId', 'name price');
    res.status(201).json(outbound);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/outbound/:id', async (req, res) => {
  try {
    await Outbound.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// WAREHOUSE (TÍNH TỒN KHO)
// =======================
app.get('/api/warehouse', async (req, res) => {
  try {
    const products = await Product.find();
    const inbounds = await Inbound.find();
    const outbounds = await Outbound.find();

    const warehouse = products.map(p => {
      const inQty = inbounds.filter(i => i.productId.toString() === p._id.toString())
                             .reduce((a,b)=>a+b.quantity, 0);
      const outQty = outbounds.filter(o => o.productId.toString() === p._id.toString())
                              .reduce((a,b)=>a+b.quantity, 0);
      return {
        productId: { _id: p._id, name: p.name },
        stock: inQty - outQty
      };
    });

    res.json(warehouse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// SPA fallback
// =======================
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// const PORT = process.env.PORT || 3000;
// const HOST = '192.168.1.165'; // hoặc '192.168.1.165' nếu muốn cố định

// app.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}`));
