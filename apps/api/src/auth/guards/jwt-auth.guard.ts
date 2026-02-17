import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const result = await super.canActivate(context);

    if (result) {
      const request = context.switchToHttp().getRequest();
      // Set tenantId on request for use by TenantGuard and @CurrentTenant decorator
      if (request.user?.tenantId) {
        request.tenantId = request.user.tenantId;
      }
    }

    return result as boolean;
  }
}
