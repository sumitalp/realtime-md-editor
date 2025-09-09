// src/schemas/document.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DocumentDocument = DocumentModel & Document;

export enum Role {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

@Schema({ _id: false })
export class DocumentCollaborator {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: Role, default: Role.EDITOR })
  role: Role;

  @Prop({ default: Date.now })
  addedAt: Date;
}

const DocumentCollaboratorSchema =
  SchemaFactory.createForClass(DocumentCollaborator);

@Schema({ timestamps: true })
export class DocumentModel {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  content: string;

  @Prop({ type: Buffer })
  yjsState?: Buffer;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [DocumentCollaboratorSchema], default: [] })
  collaborators: DocumentCollaborator[];

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: Date.now })
  lastEditedAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentModel);
