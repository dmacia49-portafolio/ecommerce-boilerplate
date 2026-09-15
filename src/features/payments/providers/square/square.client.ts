import {
    SquareClient,
    SquareEnvironment,
} from "square";

const accessToken =
    process.env.SQUARE_ACCESS_TOKEN;

const environment =
    process.env.SQUARE_ENVIRONMENT;

if (!accessToken) {
    throw new Error(
        "SQUARE_ACCESS_TOKEN is not configured.",
    );
}

if (
    environment !== "sandbox" &&
    environment !== "production"
) {
    throw new Error(
        "SQUARE_ENVIRONMENT must be sandbox or production.",
    );
}

export const squareClient =
    new SquareClient({
        token: accessToken,

        environment:
            environment === "production"
                ? SquareEnvironment.Production
                : SquareEnvironment.Sandbox,
    });