import { Module } from '@nestjs/common';
import { CreditNoteController } from './http/credit-note.controller';
import { CreditNoteService } from './credit-note.service';

@Module({
  controllers: [CreditNoteController],
  providers: [CreditNoteService],
  exports: [CreditNoteService],
})
export class CreditNoteModule {}
