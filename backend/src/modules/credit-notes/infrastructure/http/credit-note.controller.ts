import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { CreditNoteService } from '../credit-note.service';
import { CreateCreditNoteDto } from '../dto/create-credit-note.dto';

@Controller('credit-notes')
export class CreditNoteController {
  constructor(private readonly service: CreditNoteService) {}

  @Get()
  @Roles('admin', 'gerente')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'gerente')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findById(id, user.tenantId);
  }

  @Get('by-sale/:saleId')
  @Roles('admin', 'gerente', 'cajero')
  findBySale(
    @Param('saleId') saleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findBySale(saleId, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  create(
    @Body() dto: CreateCreditNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.id, user.tenantId);
  }
}
