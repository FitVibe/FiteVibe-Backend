import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import 'dotenv/config';

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export async function sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data: Record<string, string> = {}
): Promise<boolean> {
    try {
        await getMessaging().send({
            token: fcmToken,
            notification: { title, body },
            data,
            android: { priority: 'high' },
            apns: {
                payload: {
                    aps: { sound: 'default' }
                }
            }
        });
        console.log(`[FCM] Notification sent to token: ${fcmToken.substring(0, 20)}...`);
        return true;
    } catch (err) {
        console.error('[FCM] Failed to send notification:', err);
        return false;
    }
}
