import { Module } from '@nestjs/common';
import { CreditNoteController } from './credit-note.controller';
import { CreditNoteService } from './credit-note.service';
import { PostgresCreditNoteRepo } from './PostgresCreditNoteRepo';

@Module({
  controllers: [CreditNoteController],
  providers: [CreditNoteService, PostgresCreditNoteRepo],
  exports: [CreditNoteService],
})
export class CreditNoteModule {}
