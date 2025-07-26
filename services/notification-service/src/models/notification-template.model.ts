import { Schema, model, Document } from 'mongoose';

export interface INotificationTemplate extends Document {
  name: string;
  type: 'email' | 'sms' | 'push';
  subject?: string;
  content: string;
  variables: string[];
}

const NotificationTemplateSchema = new Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['email', 'sms', 'push'] },
  subject: { type: String, required: false },
  content: { type: String, required: true },
  variables: [{ type: String }]
}, { timestamps: true });

export const NotificationTemplate = model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema); 