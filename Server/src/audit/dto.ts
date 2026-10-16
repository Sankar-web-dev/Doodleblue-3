import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto, trim } from '../common/dto.js';

export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  action?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  resource?: string;
}
