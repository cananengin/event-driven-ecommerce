import { Schema, model } from 'mongoose';
const ProcessedEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true },
}, { timestamps: { createdAt: 'processedAt' } });
export const ProcessedEvent = model('ProcessedEvent', ProcessedEventSchema);
