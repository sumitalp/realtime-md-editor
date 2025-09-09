// src/documents/dto/add-collaborator.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AddCollaboratorDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
