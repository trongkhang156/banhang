import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const InboundItemSchema = new Schema({
  productId:{type:Schema.Types.ObjectId, ref:'Product', required:true},
  quantity:{type:Number, required:true}
});

const InboundReceiptSchema = new Schema({
  code:{type:String, required:true, unique:true},
  items:[InboundItemSchema]
},{timestamps:true});

export default model('InboundReceipt', InboundReceiptSchema);
