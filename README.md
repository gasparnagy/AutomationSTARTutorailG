# E-commerce Checkout API

## What is this API?

A small e-commerce REST API built with **Node.js** and **Express**, intended for learning and practicing API testing.
It has four endpoints:

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/register` | POST | No | Register a new user |
| `/api/login` | POST | No | Log in and receive a bearer token |
| `/api/cart` | GET | Yes | View the current user's cart |
| `/api/cart` | POST | Yes | Add a product to the cart |
| `/api/checkout` | POST | Yes | Pay for the cart and create an order |

All data is kept in an **in-memory database** (plain JavaScript variables in [src/db.js](src/db.js)).
Every server restart resets the data to the seed data below.

The API is documented with an OpenAPI (Swagger) specification in [docs/swagger.yaml](docs/swagger.yaml), which the server also renders as an interactive page.

## How to install

Requirements: [Node.js](https://nodejs.org/) 18 or newer and npm.

```bash
git clone https://github.com/gasparnagy/AutomationSTARTutorailG.git
```

```bash
cd AutomationSTARTutorailG
```

```bash
npm install
```

## How to run

```bash
npm start
```

The server starts on port `3000`. To use another port, set the `PORT` environment variable (e.g. `PORT=4000 npm start`).

For development with automatic restart on file changes:

```bash
npm run dev
```

## Important URLs

| URL | What it is |
|---|---|
| http://localhost:3000/api-docs | Swagger UI – interactive API documentation |
| http://localhost:3000/api-docs/swagger.yaml | Raw Swagger/OpenAPI YAML specification |
| http://localhost:3000/api | Base URL of the API endpoints |
| http://localhost:3000/ | Redirects to the Swagger UI |

## Test data

### Users

| ID | Name | Email | Password |
|---|---|---|---|
| 1 | Alice Johnson | alice@example.com | alice123 |
| 2 | Bob Smith | bob@example.com | bob123 |
| 3 | Carol White | carol@example.com | carol123 |

### Products

| ID | Name | Price | Stock |
|---|---|---|---|
| 1 | Wireless Mouse | 25.00 | 100 |
| 2 | Mechanical Keyboard | 80.00 | 50 |
| 3 | USB-C Monitor 27" | 300.00 | 20 |

## Business rules

1. **Payment discount at checkout**
   - Paying with **`cash`** gives a **10% discount** on the cart subtotal.
   - Paying with **`credit_card`** gives **no discount**.
   - Example: a cart of 2 × Wireless Mouse (50.00) costs **45.00** with cash and **50.00** with credit card.
2. **Authentication** – `cart` and `checkout` require a token from `/api/login`, sent as `Authorization: Bearer <token>`.
3. **Registration** – `name`, `email` and `password` are required; the email must be unique (case-insensitive).
4. **Cart** – `productId` must exist and `quantity` must be a positive integer (defaults to 1). Adding a product already in the cart increases its quantity. The quantity in the cart cannot exceed the product stock.
5. **Checkout**
   - `paymentMethod` must be `cash` or `credit_card`.
   - The cart must not be empty, and there must be enough stock for every item.
   - A successful checkout creates an order, reduces product stock and empties the cart.
   - Amounts are rounded to 2 decimals.

## Example flow (curl)

```bash
# 1. Log in
curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"alice123"}'

# 2. Add 2 Wireless Mice to the cart (use the token from step 1)
curl -s -X POST http://localhost:3000/api/cart \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":2}'

# 3. Check out with cash (10% discount -> total 45)
curl -s -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"paymentMethod":"cash"}'
```

## Project structure

```
docs/swagger.yaml   OpenAPI specification
src/server.js       Starts the HTTP server
src/app.js          Express app, Swagger UI and error handling
src/routes.js       register, login, cart and checkout endpoints
src/auth.js         Token creation and auth middleware
src/db.js           In-memory database with seed data
```
