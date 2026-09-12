import "dotenv/config";

import { expireDueReservations } from "../src/features/checkout/reservation.service";

async function main() {
    console.log(
        "Checking for expired inventory reservations...",
    );

    const result =
        await expireDueReservations();

    console.log(
        `Expired reservations released: ${result.expiredCount}`,
    );
}

main()
    .catch((error) => {
        console.error(
            "Reservation cleanup failed:",
            error,
        );

        process.exitCode = 1;
    });