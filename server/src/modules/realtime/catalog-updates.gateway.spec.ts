import {
  CATALOG_UPDATED_EVENT,
  CatalogUpdatesGateway,
} from './catalog-updates.gateway';

describe('CatalogUpdatesGateway', () => {
  it('broadcasts catalog invalidations without including database data', () => {
    const gateway = new CatalogUpdatesGateway();
    const emit = jest.fn();
    Reflect.set(gateway, 'server', { emit });

    gateway.notifyCatalogUpdated();

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(CATALOG_UPDATED_EVENT);
  });
});
