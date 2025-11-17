// models/Outbound.js
const mongoose = require('mongoose');

const outboundSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  date: { type: String, required: true } // để dạng string
}, { timestamps: true });

module.exports = mongoose.model('Outbound', outboundSchema);
