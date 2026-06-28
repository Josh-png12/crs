import pg from "pg";
import bcrypt from "bcryptjs";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/ivn_attendance",
});

async function main() {
  await client.connect();

  const hashedPassword = await bcrypt.hash("admin123", 12);

  await client.query(
    `INSERT INTO users (id, name, email, password, role, "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, now())
     ON CONFLICT (email) DO NOTHING`,
    ["Super Admin", "admin@ivn.church", hashedPassword, "SUPER_ADMIN"]
  );

  await client.query(
    `INSERT INTO services (id, name, type, date, "qrToken", "isOpen", notes, "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, $5, now())
     ON CONFLICT ("qrToken") DO NOTHING`,
    [
      "Culto Dominical - Prueba",
      "SUNDAY",
      new Date("2026-06-29T10:00:00.000Z"),
      "seed-service-token",
      "Servicio de prueba generado por seed",
    ]
  );

  const admin = await client.query(`SELECT email, role FROM users WHERE email = 'admin@ivn.church'`);
  const service = await client.query(`SELECT name, "qrToken" FROM services WHERE "qrToken" = 'seed-service-token'`);

  console.log("Seed completado:");
  console.log("  Usuario:", admin.rows[0].email, "/ rol:", admin.rows[0].role, "/ contraseña: admin123");
  console.log("  Servicio:", service.rows[0].name, "/ qrToken:", service.rows[0].qrToken);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => client.end());
