import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    console.log('✅ WebSocket server initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Authenticate socket connection
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (token) {
        const payload = this.jwtService.verify(token);
        client.data.userId = payload.userId;
        client.data.tenantId = payload.tenantId;
        client.data.role = payload.role;
        console.log(`✅ Client connected: ${client.id} (User: ${payload.userId})`);
      } else {
        console.log(`⚠️ Client connected without auth: ${client.id}`);
      }
    } catch (error) {
      console.error('WebSocket auth error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  private async resolveTenantId(tenantIdOrSubdomain: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdOrSubdomain);
    if (isUuid) return tenantIdOrSubdomain;
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: tenantIdOrSubdomain },
      select: { id: true },
    });
    return tenant?.id ?? tenantIdOrSubdomain;
  }

  @SubscribeMessage('join:tenant')
  async handleJoinTenant(client: Socket, tenantId: string) {
    const resolvedId = await this.resolveTenantId(tenantId);
    client.join(`tenant:${resolvedId}:orders`);
    console.log(`📍 Client ${client.id} joined tenant ${resolvedId} orders room`);
    return { success: true };
  }

  @SubscribeMessage('join:kitchen')
  async handleJoinKitchen(client: Socket, tenantId: string) {
    const isAuthorized =
      client.data.role === 'KITCHEN' ||
      client.data.role === 'TENANT_ADMIN' ||
      client.data.role === 'SUPER_ADMIN';
    if (isAuthorized) {
      const resolvedId = await this.resolveTenantId(tenantId);
      client.join(`tenant:${resolvedId}:kitchen`);
      console.log(`👨‍🍳 Client ${client.id} joined tenant ${resolvedId} kitchen room`);
      return { success: true };
    }
    return { success: false, error: 'Unauthorized' };
  }

  @SubscribeMessage('join:customer')
  handleJoinCustomer(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      client.join(`customer:${userId}:orders`);
      console.log(`👤 Client ${client.id} joined customer room`);
      return { success: true };
    }
    return { success: false, error: 'Unauthorized' };
  }

  // ========== EVENT EMITTERS ==========

  emitOrderCreated(tenantId: string, order: any) {
    this.server.to(`tenant:${tenantId}:kitchen`).emit('order:created', order);
    this.server.to(`tenant:${tenantId}:orders`).emit('order:created', order);
    console.log(`📢 Emitted order:created for tenant ${tenantId}`);
  }

  emitOrderStatusChanged(tenantId: string, order: any) {
    this.server.to(`tenant:${tenantId}:kitchen`).emit('order:statusChanged', order);
    this.server.to(`tenant:${tenantId}:orders`).emit('order:statusChanged', order);
    
    if (order.customerId) {
      this.server.to(`customer:${order.customerId}:orders`).emit('order:statusChanged', order);
    }
    
    console.log(`📢 Emitted order:statusChanged for order ${order.orderNumber}`);
  }

  emitOrderUpdated(tenantId: string, order: any) {
    this.server.to(`tenant:${tenantId}:orders`).emit('order:updated', order);
    
    if (order.customerId) {
      this.server.to(`customer:${order.customerId}:orders`).emit('order:updated', order);
    }
  }

  emitMenuUpdated(tenantId: string) {
    this.server.to(`tenant:${tenantId}:orders`).emit('menu:updated');
    console.log(`📢 Emitted menu:updated for tenant ${tenantId}`);
  }

  emitTableStatusChanged(tenantId: string, table: any) {
    this.server.to(`tenant:${tenantId}:orders`).emit('table:statusChanged', table);
  }
}
