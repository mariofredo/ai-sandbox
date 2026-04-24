import { defineConfig } from 'prisma/config'
import pg from 'pg'

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/procurement_db'

export default defineConfig({
  datasource: {
    url: connectionString,
    adapter: async () => {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const pool = new pg.Pool({ connectionString })
      return new PrismaPg(pool)
    },
  },
})
