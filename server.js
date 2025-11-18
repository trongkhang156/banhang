// server.js
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import receiptTemplate from './templates/receipt_template.js';

import Product from './models/Product.js';
import InboundReceipt from './models/InboundReceipt.js';
import OutboundReceipt from './models/OutboundReceipt.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error('MongoDB error', err));

// ------------------- Helper: generate code -------------------
async function generateCode(prefix, Model){
  const count = await Model.countDocuments();
  return `${prefix}${String(count + 1).padStart(4,'0')}`;
}

// ------------------- PRODUCTS -------------------
app.get('/api/products', async(req,res)=>{
  try {
    const products = await Product.find();
    res.json(products);
  } catch(err) { res.status(500).json({error: err.message}); }
});

app.post('/api/products', async(req,res)=>{
  try {
    const p = new Product(req.body);
    await p.save();
    res.status(201).json(p);
  } catch(err) { res.status(400).json({error: err.message}); }
});

// ------------------- INBOUND -------------------
app.get('/api/inbound', async(req,res)=>{
  try {
    const data = await InboundReceipt.find().populate('items.productId').sort({createdAt:-1});
    res.json(data);
  } catch(err) { res.status(500).json({error: err.message}); }
});

app.post('/api/inbound', async(req,res)=>{
  try {
    const { items } = req.body;
    if(!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({error: 'Items required'});

    const code = await generateCode('PN', InboundReceipt);
    const receipt = new InboundReceipt({ code, items });
    await receipt.save();
    await receipt.populate('items.productId');
    res.status(201).json(receipt);
  } catch(err) { res.status(500).json({error: err.message}); }
});

app.delete('/api/inbound/:id', async(req,res)=>{
  try {
    await InboundReceipt.findByIdAndDelete(req.params.id);
    res.json({message: 'Deleted'});
  } catch(err) { res.status(500).json({error: err.message}); }
});

// ------------------- OUTBOUND -------------------
async function getStock(productId){
  const objId = new mongoose.Types.ObjectId(productId);

  const inAgg = await InboundReceipt.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.productId': objId } },
    { $group: { _id:null, total: { $sum: '$items.quantity' } } }
  ]);

  const outAgg = await OutboundReceipt.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.productId': objId } },
    { $group: { _id:null, total: { $sum: '$items.quantity' } } }
  ]);

  return (inAgg[0]?.total || 0) - (outAgg[0]?.total || 0);
}

app.get('/api/outbound', async(req,res)=>{
  try {
    const data = await OutboundReceipt.find().populate('items.productId').sort({createdAt:-1});
    res.json(data);
  } catch(err) { res.status(500).json({error: err.message}); }
});

app.post('/api/outbound', async(req,res)=>{
  try {
    const { items } = req.body;
    if(!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({error: 'Items required'});

    for(const it of items){
      const stock = await getStock(it.productId);
      if(it.quantity > stock)
        return res.status(400).json({error: `Sản phẩm ${it.productId} vượt tồn kho (còn ${stock})`});
    }

    const code = await generateCode('PX', OutboundReceipt);
    const receipt = new OutboundReceipt({ code, items });
    await receipt.save();
    await receipt.populate('items.productId');
    res.status(201).json(receipt);
  } catch(err) { res.status(500).json({error: err.message}); }
});

app.delete('/api/outbound/:id', async(req,res)=>{
  try {
    await OutboundReceipt.findByIdAndDelete(req.params.id);
    res.json({message: 'Deleted'});
  } catch(err) { res.status(500).json({error: err.message}); }
});

// ------------------- WAREHOUSE -------------------
app.get('/api/warehouse', async(req,res)=>{
  try {
    const products = await Product.find();
    const inbounds = await InboundReceipt.find();
    const outbounds = await OutboundReceipt.find();

    const warehouse = products.map(p=>{
      const inQty = inbounds.filter(i=>i.items.some(it=>it.productId.toString() === p._id.toString()))
        .reduce((a,b)=>a+b.items.reduce((x,it)=>x+it.quantity,0),0);

      const outQty = outbounds.filter(o=>o.items.some(it=>it.productId.toString() === p._id.toString()))
        .reduce((a,b)=>a+b.items.reduce((x,it)=>x+it.quantity,0),0);

      return { productId:{ _id: p._id, name: p.name }, stock: inQty - outQty };
    });

    res.json(warehouse);
  } catch(err) { res.status(500).json({error: err.message}); }
});

// ------------------- PHIẾU IN (template) -------------------
app.get('/receipt/:code', async (req,res)=>{
  const { code } = req.params;
  let receipt = await OutboundReceipt.findOne({ code }).populate('items.productId');
  let type = 'PX';
  if(!receipt){
    receipt = await InboundReceipt.findOne({ code }).populate('items.productId');
    type = 'PN';
  }
  if(!receipt) return res.status(404).send('Không tìm thấy phiếu');

  const html = receiptTemplate(receipt, type);
  res.send(html);
});
// ------------------- PRODUCTS -------------------
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// MỚI: xóa sản phẩm
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa sản phẩm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- SPA fallback -------------------
app.get('*', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
