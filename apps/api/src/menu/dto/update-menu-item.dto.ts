import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for updating menu items. All fields optional.
 * Explicit whitelist prevents ValidationPipe (forbidNonWhitelisted) from rejecting the request.
 */
export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  prepTime?: number;

  @IsOptional()
  @IsBoolean()
  availability?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryTags?: string[];

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? null : value))
  @ValidateIf((_o, v) => v != null)
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suggestedItemIds?: string[];
}
