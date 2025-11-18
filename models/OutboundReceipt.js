import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const OutboundItemSchema = new Schema({
  productId:{type:Schema.Types.ObjectId, ref:'Product', required:true},
  quantity:{type:Number, required:true}
});

const OutboundReceiptSchema = new Schema({
  code:{type:String, required:true, unique:true},
  items:[OutboundItemSchema]
},{timestamps:true});

export default model('OutboundReceipt', OutboundReceiptSchema);
