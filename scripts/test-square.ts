import "dotenv/config";

import {
    squareClient,
} from "../src/features/payments/providers/square/square.client";

async function testSquareConnection() {
    const configuredLocationId =
        process.env.SQUARE_LOCATION_ID;

    if (!configuredLocationId) {
        throw new Error(
            "SQUARE_LOCATION_ID is not configured.",
        );
    }

    const response =
        await squareClient.locations.list();

    const locations =
        response.locations ?? [];

    console.log(
        `Square connection successful. Found ${locations.length} location(s).`,
    );

    const configuredLocation =
        locations.find(
            (location) =>
                location.id ===
                configuredLocationId,
        );

    if (!configuredLocation) {
        throw new Error(
            "The configured SQUARE_LOCATION_ID was not found in this Sandbox account.",
        );
    }

    console.log(
        "Configured Sandbox location found:",
        configuredLocation.name,
    );
}

testSquareConnection().catch(
    (error) => {
        console.error(
            "Square connection failed:",
            error,
        );

        process.exit(1);
    },
);