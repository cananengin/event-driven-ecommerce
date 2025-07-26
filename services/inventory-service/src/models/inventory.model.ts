import { Schema, model, Document } from 'mongoose';

export interface IInventory extends Document {
  productId: string;
  quantity: number;
  name?: string;
}

const InventorySchema = new Schema({
  productId: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true },
  name: { type: String, required: false },
}, { timestamps: true });

export const Inventory = model<IInventory>('Inventory', InventorySchema); 