import { CreditNoteRepository, CreateCreditNoteData, CreateCreditNoteItemData } from '../ports/CreditNoteRepository.interface';
import { CreditNote } from '../../domain/CreditNote';

export class CreateCreditNoteUseCase {
  constructor(private readonly repo: CreditNoteRepository) {}

  async execute(data: CreateCreditNoteData, items: CreateCreditNoteItemData[]): Promise<CreditNote> {
    if (!data.reason?.trim()) throw new Error('El motivo de la devolución es obligatorio');
    if (items.length === 0) throw new Error('Debe incluir al menos un producto');
    if (data.total <= 0) throw new Error('El total debe ser mayor a cero');
    return this.repo.create(data, items);
  }
}
