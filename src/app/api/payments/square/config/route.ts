import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    const applicationId =
        process.env.SQUARE_APPLICATION_ID;

    const locationId =
        process.env.SQUARE_LOCATION_ID;

    const environment =
        process.env.SQUARE_ENVIRONMENT;

    if (!applicationId || !locationId) {
        return NextResponse.json(
            {
                error:
                    "Square browser configuration is incomplete.",
            },
            {
                status: 500,
            },
        );
    }

    if (
        environment !== "sandbox" &&
        environment !== "production"
    ) {
        return NextResponse.json(
            {
                error:
                    "Square environment is invalid.",
            },
            {
                status: 500,
            },
        );
    }

    return NextResponse.json(
        {
            applicationId,
            locationId,
            environment,
        },
        {
            headers: {
                "Cache-Control": "no-store",
            },
        },
    );
}