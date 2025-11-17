// models/Inbound.js
const mongoose = require('mongoose');

const inboundSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  date: { type: String, required: true }  // lưu ngày dưới dạng string
}, { timestamps: true });

module.exports = mongoose.model('Inbound', inboundSchema);
