import { Schema, model, Document } from 'mongoose';
export interface IOrder extends Document {
  userId: string;
  products: { productId: string; quantity: number }[];
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}
const OrderSchema = new Schema({
  userId: { type: String, required: true },
  products: [{ productId: { type: String, required: true }, quantity: { type: Number, required: true } }],
  totalPrice: { type: Number, required: true },
  status: { type: String, required: true, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'PENDING' },
}, { timestamps: true });
export const Order = model<IOrder>('Order', OrderSchema);
