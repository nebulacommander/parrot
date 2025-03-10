import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '../../../../src/db/index'  // Assuming this is your Drizzle instance
import { users } from '../../../../src/db/schema'  // Assuming this is your Drizzle schema
import { eq } from 'drizzle-orm'

/**
 * This endpoint handles Clerk webhook events to sync user data with our database
 * It processes user.created and user.updated events to keep our database in sync
 * with Clerk's user data
 */
export async function POST(req: Request) {
  // Verify webhook signature
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);
  
  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type;
  const { id, email_addresses, image_url, first_name, last_name } = evt.data as {
    id: string;
    email_addresses: { email_address: string }[];
    image_url: string;
    first_name: string | null;
    last_name: string | null;
  };

  if (eventType === 'user.created' || eventType === 'user.updated') {
    try {
      // Get the user's primary email
      const primaryEmail = email_addresses?.[0]?.email_address;
      const fullName = `${first_name || ''} ${last_name || ''}`.trim();

      if (!primaryEmail || !id) {
        throw new Error('User has no email address or ID');
      }

      // Upsert the user data
      await db
        .insert(users)
        .values({
          clerkId: id,
          email: primaryEmail,
          name: fullName || 'Anonymous',
          imageUrl: image_url,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: {
            email: primaryEmail,
            name: fullName || 'Anonymous',
            imageUrl: image_url,
            updatedAt: new Date(),
          },
        })
        .execute();

      return new Response('User synchronized', { status: 200 });
    } catch (error) {
      console.error('Error syncing user:', error);
      return new Response('Error syncing user', { status: 500 });
    }
  }

  return new Response('Webhook processed', { status: 200 });
}