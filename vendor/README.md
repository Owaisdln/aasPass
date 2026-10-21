# aasPass Vendor

The vendor app is an Expo and React Native application for store owners. It uses
Expo Router for navigation and can run on Android, iOS, or the web.

## Run locally

```sh
npm install
npm run start
```

Use the Expo CLI prompts to open the app in a simulator or Expo Go. To run the
web version, use `npm run web`.

For a physical device or Android emulator connecting to a local backend, set the
backend URL in **Connect to server** to an address reachable from that device.
`localhost` refers to the device itself, not the development computer. For
example, use the computer's LAN IP address on the same Wi-Fi network.

Use the same backend API URL and Supabase project as the customer app. The
server's `DATABASE_URL` must point to the database used by the backend; the
vendor app connects through the API and must not connect directly to the
database. Set `EXPO_PUBLIC_AASPASS_API_URL`,
`EXPO_PUBLIC_AASPASS_SUPABASE_URL`, and
`EXPO_PUBLIC_AASPASS_SUPABASE_ANON_KEY` in the ignored `vendor/.env`, or enter
the same settings in **Connect to server**.

## Connection and demo mode

The **Connect to server** screen stores the backend URL and Supabase settings on
the device. Demo sign-in uses the backend's configured vendor demo credentials.
Sample-store mode is an offline preview using in-memory sample data; changes in
that mode are not written to the database.

Live store, catalog, and inventory operations use the existing backend
adapters. Store-side order queue data remains sample-only because the backend
does not currently expose vendor order endpoints.

Customer store and catalog screens subscribe to the backend's `/catalog`
Socket.IO namespace. Successful store, hours, delivery, product, and stock
changes emit a payload-free `catalog.updated` event; customer clients then
refetch the public store and product endpoints. In production, include any
web app origins in the server's comma-separated `CORS_ORIGINS` setting.

## Validation

```sh
npm run typecheck
npm run lint
npm test
```
