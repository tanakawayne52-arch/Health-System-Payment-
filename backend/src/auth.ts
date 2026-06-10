import { betterAuth } from "better-auth";
import { db, database } from "./database";
import { sendEmail } from "./email-service";

export const auth = betterAuth({
  database: database,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Email verification disabled
    sendResetPassword: async ({ user, url, token }, request) => {
      console.log(`Password reset requested for ${user.email} - email service disabled`);
      // Email service disabled - no reset email sent
    }
  },
  emailVerification: {
    sendOnSignUp: false, // Email verification disabled
    sendOnSignIn: false,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      console.log(`Email verification requested for ${user.email} - email service disabled`);
      // Email service disabled - no verification email sent
    },
    afterEmailVerification: async (user, request) => {
      console.log(`User ${user.email} verification completed - email service disabled`);
      
      // Log verification event
      await db.insertInto("audit_logs")
        .values({
          user_id: parseInt(user.id, 10) || null,
          user_email: user.email,
          action_type: "EMAIL_VERIFIED",
          details: `Email verified for user: ${user.email}`,
          created_at: new Date()
        })
        .execute();
    }
  },
  emailOTP: {
    enabled: true,
    sendOTP: async ({ email, otp, type }, request) => {
      // Find user to get backup email
      const user = await db.selectFrom('users')
        .selectAll()
        .where('email', '=', email)
        .executeTakeFirst();
      
      // Send OTP to backup email if available, otherwise to primary email
      const targetEmail = user?.backup_email || email;
      
      const template = type === "login" ? "email-otp-login" : "email-otp-forgot";
      await sendEmail({
        to: targetEmail,
        subject: type === "login" 
          ? "Your Kudombela Data Trust Login Code" 
          : "Your Kudombela Data Trust Password Reset Code",
        template: template,
        data: {
          otp: otp,
          expiryMinutes: 10,
          type: type,
          userName: user?.first_name || email.split('@')[0],
          targetEmailType: user?.backup_email ? "backup email" : "primary email"
        }
      });
    },
    expiresIn: 600, // 10 minutes in seconds
    otpLength: 6
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      // Check if user exists in our system
      if (account?.provider !== "email") {
        // For social login, check if user exists in our database
        const existingUser = await db.selectFrom('users')
          .selectAll()
          .where('email', '=', user.email)
          .executeTakeFirst();
        
        if (!existingUser) {
          // Create user record for social login
          await db.insertInto("users")
            .values({
              email: user.email,
              first_name: user.name?.split(' ')[0] || '',
              last_name: user.name?.split(' ').slice(1).join(' ') || '',
              email_verified: true,
              created_at: new Date(),
              role_id: 8, // General User role
              rank_level: 8,
              password_hash: "", // Not used for social provider
              is_active: true,
              backup_email_verified: false
            })
            .execute();
        }
      }
      
      return true;
    },
    async session({ session, user }) {
      // Add user role and permissions to session
      const dbUser = await db.selectFrom('users')
        .selectAll()
        .where('id', '=', parseInt(user.id, 10))
        .executeTakeFirst();
      
      if (dbUser) {
        const role = await db.selectFrom('roles')
          .selectAll()
          .where('id', '=', dbUser.role_id)
          .executeTakeFirst();

        const province = dbUser.province_id 
          ? await db.selectFrom('provinces')
              .selectAll()
              .where('id', '=', dbUser.province_id)
              .executeTakeFirst()
          : null;

        const district = dbUser.district_id
          ? await db.selectFrom('districts')
              .selectAll()
              .where('id', '=', dbUser.district_id)
              .executeTakeFirst()
          : null;

        const facility = dbUser.station_id
          ? await db.selectFrom('physical_facilities')
              .selectAll()
              .where('id', '=', dbUser.station_id)
              .executeTakeFirst()
          : null;

        if (role) {
          session.user.role = role;
          session.user.permissions = getRolePermissions(role.rank_level);
        }
        session.user.province = province || null;
        session.user.district = district || null;
        session.user.facility = facility || null;
      }
      
      return session;
    }
  }
});

// Helper function to get role permissions
function getRolePermissions(rank) {
  const permissions = {
    1: ['admin', 'read', 'write', 'delete', 'manage_users', 'manage_system'],
    2: ['picto_manager', 'read', 'write', 'manage_facilities'],
    3: ['picto_viewer', 'read'],
    4: ['dicto_manager', 'read', 'write', 'manage_district_facilities'],
    5: ['dicto_viewer', 'read'],
    6: ['phro', 'read', 'manage_hr_province'],
    7: ['dhro', 'read', 'manage_hr_district'],
    8: ['general_user', 'read_personal']
  };
  
  return permissions[rank] || [];
}
