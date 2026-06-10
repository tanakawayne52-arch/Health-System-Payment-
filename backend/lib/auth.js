import { betterAuth } from "better-auth";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";

const db = new Kysely({
    dialect: new MysqlDialect({
        pool: createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'kudombela_data_trust',
        })
    })
});

export const auth = betterAuth({
    database: {
        db: db,
        type: "mysql",
    },
    emailAndPassword: {
        enabled: true,
    },
    // Adding the specific fields required by the user
    user: {
        additionalFields: {
            ec_number: { type: "string" },
            phone_number: { type: "string" },
            role: { type: "string" },
            rank_level: { type: "number" },
            province_id: { type: "number" },
            district_id: { type: "number" },
            station_id: { type: "number" }
        }
    },
    plugins: [
        // The user wants OTP/Token based logic. 
        // We can use magic link for "login with phone" style.
        // Or create custom logic in the endpoint using better-auth core methods.
    ]
});
