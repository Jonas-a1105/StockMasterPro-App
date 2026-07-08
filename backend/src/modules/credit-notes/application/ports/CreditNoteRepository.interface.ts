import { CreditNote } from '../../domain/CreditNote';
import { CreditNoteItem } from '../../domain/CreditNoteItem';

export interface CreateCreditNoteData {
  tenantId: string;
  saleId?: string;
  customerId?: string;
  userId: string;
  reason: string;
  total: number;
  refundMethod: string;
}

export interface CreateCreditNoteItemData {
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CreditNoteRepository {
  findAll(tenantId: string): Promise<CreditNote[]>;
  findById(id: string): Promise<CreditNote | null>;
  create(data: CreateCreditNoteData, items: CreateCreditNoteItemData[]): Promise<CreditNote>;
}
