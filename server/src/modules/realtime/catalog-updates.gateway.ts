import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';

import { isCorsOriginAllowed } from '../../common/cors-origin';

export const CATALOG_UPDATED_EVENT = 'catalog.updated';

@WebSocketGateway({
  namespace: '/catalog',
  cors: {
    origin: (origin, callback) => {
      const allowed = isCorsOriginAllowed(origin);
      callback(
        allowed ? null : new Error('Origin is not allowed by CORS'),
        allowed,
      );
    },
  },
})
export class CatalogUpdatesGateway {
  @WebSocketServer()
  private server!: Server;

  notifyCatalogUpdated(): void {
    this.server.emit(CATALOG_UPDATED_EVENT);
  }
}
