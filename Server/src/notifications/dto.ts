import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto, toBool } from '../common/dto.js';

export class ListNotificationsQueryDto extends PaginationQueryDto {
  /** When true, only unread notifications are returned. */
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  unreadOnly?: boolean;
}
