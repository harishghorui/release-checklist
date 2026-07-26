# Release Checklist

A modern web application built with **Next.js**, **Prisma ORM**, and **PostgreSQL** to manage release checklists.

---

## 🛠️ Prerequisites

Before getting started, ensure you have the following installed on your machine:

- **Node.js**: `v18.x` or higher
- **npm**, **yarn**, **pnpm**, or **bun**
- **PostgreSQL Database** (e.g., local PostgreSQL instance or hosted service like Supabase)

---

## 🚀 Getting Started (Local Setup)

### 1. Clone the Repository & Install Dependencies

```bash
git clone <repository-url>
cd release-checklist
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory and configure your PostgreSQL database connection strings:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/release_checklist?sslmode=disable"

# Optional direct connection string if using connection pooling (e.g. Supabase)
DIRECT_URL="postgresql://user:password@localhost:5432/release_checklist?sslmode=disable"
```

### 3. Set Up the Database

Generate the Prisma client and apply the database schema:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes to the database
npx prisma db push
```

*(Optional)* To run database migrations:
```bash
npx prisma migrate dev
```

### 4. Run the Development Server

Start the Next.js local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🗄️ Database Schema

The database schema is managed using **Prisma** with PostgreSQL.

### `Release` Model

Location: [`prisma/schema.prisma`](prisma/schema.prisma)

| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id @default(uuid())` | Unique identifier (UUID v4) |
| `name` | `String` | | Name/title of the release |
| `date` | `DateTime` | | Scheduled date for the release |
| `additionalInfo` | `String?` | `@default("")` | Optional notes or extra info |
| `completedSteps` | `String[]` | `@default([])` | Array of completed step identifier IDs |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Record last update timestamp |

```prisma
model Release {
  id             String   @id @default(uuid())
  name           String
  date           DateTime
  additionalInfo String?  @default("")
  completedSteps String[] @default([])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## 🔌 API Endpoints

All API routes are served under the `/api` prefix.

### 1. Fetch All Releases
- **HTTP Method**: `GET`
- **Path**: `/api/releases`
- **Description**: Fetches a list of all releases ordered by `createdAt` descending.
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "name": "Release 1.0.0",
      "date": "2026-08-01T00:00:00.000Z",
      "additionalInfo": "Initial release notes",
      "completedSteps": ["step-1", "step-2"],
      "createdAt": "2026-07-26T12:00:00.000Z",
      "updatedAt": "2026-07-26T12:30:00.000Z"
    }
  ]
  ```

---

### 2. Create a Release
- **HTTP Method**: `POST`
- **Path**: `/api/releases`
- **Description**: Creates a new release entry.
- **Request Body**:
  ```json
  {
    "name": "Release 1.1.0",
    "date": "2026-08-15T00:00:00.000Z",
    "additionalInfo": "Optional additional info"
  }
  ```
- **Response**: `201 Created`

---

### 3. Get Release by ID
- **HTTP Method**: `GET`
- **Path**: `/api/releases/[id]`
- **Description**: Retrieves details for a specific release by its `id`.
- **Response**: `200 OK` (or `404 Not Found` if the release does not exist)

---

### 4. Update Release
- **HTTP Method**: `PATCH`
- **Path**: `/api/releases/[id]`
- **Description**: Updates attributes of an existing release.
- **Request Body** (all fields optional):
  ```json
  {
    "name": "Updated Release Title",
    "date": "2026-08-20T00:00:00.000Z",
    "additionalInfo": "Updated information",
    "completedSteps": ["step-1", "step-2", "step-3"]
  }
  ```
- **Response**: `200 OK`

---

### 5. Delete Release
- **HTTP Method**: `DELETE`
- **Path**: `/api/releases/[id]`
- **Description**: Deletes a release entry by its `id`.
- **Response**: `200 OK`
  ```json
  {
    "message": "Release deleted successfully"
  }
  ```

---

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the production build server.
- `npm run lint`: Runs ESLint to check for code quality and errors.

