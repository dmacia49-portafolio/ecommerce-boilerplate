import {
    WebhooksHelper,
} from "square";

export async function verifySquareWebhook(
    signatureHeader: string,
    rawBody: string,
): Promise<boolean> {
    const signatureKey =
        process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

    const notificationUrl =
        process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;

    if (!signatureKey) {
        throw new Error(
            "SQUARE_WEBHOOK_SIGNATURE_KEY is not configured.",
        );
    }

    if (!notificationUrl) {
        throw new Error(
            "SQUARE_WEBHOOK_NOTIFICATION_URL is not configured.",
        );
    }

    return WebhooksHelper.verifySignature({
        requestBody: rawBody,
        signatureHeader,
        signatureKey,
        notificationUrl,
    });
}