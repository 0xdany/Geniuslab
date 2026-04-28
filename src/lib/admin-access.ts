import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { adminInvites, adminProfiles } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getCurrentAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user?.email) return null;

  const [profile] = await db.select().from(adminProfiles).where(eq(adminProfiles.userId, user.id)).limit(1);
  if (profile) return { session, user, profile };

  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
  const [invite] = await db
    .select()
    .from(adminInvites)
    .where(eq(adminInvites.email, user.email.toLowerCase()))
    .limit(1);

  if (user.email.toLowerCase() === initialAdminEmail || invite) {
    const [created] = await db
      .insert(adminProfiles)
      .values({ userId: user.id, role: "admin" })
      .onConflictDoNothing()
      .returning();
    return { session, user, profile: created ?? profile };
  }

  return null;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/?admin=required");
  return admin;
}
