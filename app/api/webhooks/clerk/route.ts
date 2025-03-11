import { db } from "../../../../src/db/index";
import { users } from "../../../../src/db/schema";
import { eq } from "drizzle-orm";

export const POST = async (req: Request) => {
    const { data } = await req.json();
    const emailAddress = data.email_addresses[0].email_address;
    const firstName = data.first_name;
    const lastName = data.last_name;
    const imageUrl = data.image_url;
    const clerkId = data.id;

    try {
        // Check if user exists
        const existingUsers = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, clerkId));

        if (existingUsers.length === 0) {
            // Create new user
            await db.insert(users).values({
                email: emailAddress,
                name: `${firstName} ${lastName}`.trim(),
                imageUrl: imageUrl ?? null,
                clerkId: clerkId,
            });
        } else {
            // Update existing user
            await db
                .update(users)
                .set({
                    email: emailAddress,
                    name: `${firstName} ${lastName}`.trim(),
                    imageUrl: imageUrl ?? null,
                })
                .where(eq(users.clerkId, clerkId));
        }

        return new Response('User successfully processed', { status: 200 });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response('Error processing webhook', { status: 500 });
    }
}