import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@digital-order/types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const Public = () => SetMetadata('isPublic', true);
