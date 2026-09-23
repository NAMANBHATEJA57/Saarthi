import { auth } from "@/auth";

/**
 * Returns the currently authenticated user session.
 * If the user is not authenticated, returns null.
 */
export async function getAuthSession() {
  const session = await auth();
  return session;
}

/**
 * Throws an error if the user is not authenticated.
 * Returns the authenticated user session.
 */
export async function requireAuth() {
  const session = await getAuthSession();
  
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  
  return session;
}

/**
 * Validates that the resource belongs to the current user.
 * 
 * @param resourceUserId - The user ID attached to the resource being accessed
 * @returns boolean true if valid, throws error otherwise
 */
export async function verifyOwnership(resourceUserId: string | null) {
  const session = await requireAuth();
  
  if (!resourceUserId) {
    // If resource is global (no owner), it's read-only for all by default
    // Or we could handle this depending on specific global read/write rules.
    return true; 
  }
  
  if (session.user?.id !== resourceUserId) {
    throw new Error("Forbidden: Resource does not belong to the authenticated user");
  }
  
  return true;
}
