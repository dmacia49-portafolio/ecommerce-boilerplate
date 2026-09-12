import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
    PrismaClient,
    ProductStatus,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({
    connectionString,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    console.log("Starting database seed...");

    // ============================================================
    // CATEGORIES
    // ============================================================

    const keyboards = await prisma.category.upsert({
        where: {
            slug: "keyboards",
        },
        update: {
            name: "Keyboards",
            description: "Mechanical and everyday keyboards.",
            isActive: true,
        },
        create: {
            name: "Keyboards",
            slug: "keyboards",
            description: "Mechanical and everyday keyboards.",
            isActive: true,
        },
    });

    const mice = await prisma.category.upsert({
        where: {
            slug: "mice",
        },
        update: {
            name: "Mice",
            description: "Wired and wireless computer mice.",
            isActive: true,
        },
        create: {
            name: "Mice",
            slug: "mice",
            description: "Wired and wireless computer mice.",
            isActive: true,
        },
    });

    const audio = await prisma.category.upsert({
        where: {
            slug: "audio",
        },
        update: {
            name: "Audio",
            description: "Headsets and desktop audio products.",
            isActive: true,
        },
        create: {
            name: "Audio",
            slug: "audio",
            description: "Headsets and desktop audio products.",
            isActive: true,
        },
    });

    const accessories = await prisma.category.upsert({
        where: {
            slug: "accessories",
        },
        update: {
            name: "Accessories",
            description: "Useful desktop and computer accessories.",
            isActive: true,
        },
        create: {
            name: "Accessories",
            slug: "accessories",
            description: "Useful desktop and computer accessories.",
            isActive: true,
        },
    });

    console.log("Categories seeded.");

    // ============================================================
    // PRODUCT 1
    // Mechanical Keyboard
    // ============================================================

    const keyboard = await prisma.product.upsert({
        where: {
            slug: "mechanical-keyboard",
        },
        update: {
            name: "Mechanical Keyboard",
            description:
                "A reusable demo mechanical keyboard product with multiple switch variants.",
            brand: "DemoTech",
            status: ProductStatus.ACTIVE,
        },
        create: {
            name: "Mechanical Keyboard",
            slug: "mechanical-keyboard",
            description:
                "A reusable demo mechanical keyboard product with multiple switch variants.",
            brand: "DemoTech",
            status: ProductStatus.ACTIVE,
        },
    });

    await prisma.productCategory.upsert({
        where: {
            productId_categoryId: {
                productId: keyboard.id,
                categoryId: keyboards.id,
            },
        },
        update: {},
        create: {
            productId: keyboard.id,
            categoryId: keyboards.id,
        },
    });

    await prisma.productImage.deleteMany({
        where: {
            productId: keyboard.id,
        },
    });

    await prisma.productImage.createMany({
        data: [
            {
                productId: keyboard.id,
                url: "/demo/products/mechanical-keyboard-1.jpg",
                altText: "Mechanical keyboard front view",
                sortOrder: 1,
                isPrimary: true,
            },
            {
                productId: keyboard.id,
                url: "/demo/products/mechanical-keyboard-2.jpg",
                altText: "Mechanical keyboard angled view",
                sortOrder: 2,
                isPrimary: false,
            },
        ],
    });

    const keyboardRed = await prisma.productVariant.upsert({
        where: {
            sku: "DEMO-KB-RED",
        },
        update: {
            productId: keyboard.id,
            name: "Red Switch",
            price: "89.99",
            compareAtPrice: "99.99",
            currency: "USD",
            isActive: true,
        },
        create: {
            productId: keyboard.id,
            name: "Red Switch",
            sku: "DEMO-KB-RED",
            price: "89.99",
            compareAtPrice: "99.99",
            currency: "USD",
            isActive: true,
        },
    });

    const keyboardBrown = await prisma.productVariant.upsert({
        where: {
            sku: "DEMO-KB-BROWN",
        },
        update: {
            productId: keyboard.id,
            name: "Brown Switch",
            price: "94.99",
            compareAtPrice: null,
            currency: "USD",
            isActive: true,
        },
        create: {
            productId: keyboard.id,
            name: "Brown Switch",
            sku: "DEMO-KB-BROWN",
            price: "94.99",
            currency: "USD",
            isActive: true,
        },
    });

    await prisma.inventory.upsert({
        where: {
            variantId: keyboardRed.id,
        },
        update: {
            quantityAvailable: 25,
            quantityReserved: 0,
            reorderLevel: 5,
        },
        create: {
            variantId: keyboardRed.id,
            quantityAvailable: 25,
            quantityReserved: 0,
            reorderLevel: 5,
        },
    });

    await prisma.inventory.upsert({
        where: {
            variantId: keyboardBrown.id,
        },
        update: {
            quantityAvailable: 18,
            quantityReserved: 0,
            reorderLevel: 5,
        },
        create: {
            variantId: keyboardBrown.id,
            quantityAvailable: 18,
            quantityReserved: 0,
            reorderLevel: 5,
        },
    });

    // ============================================================
    // PRODUCT 2
    // Wireless Mouse
    // ============================================================

    const mouse = await prisma.product.upsert({
        where: {
            slug: "wireless-mouse",
        },
        update: {
            name: "Wireless Mouse",
            description:
                "A lightweight wireless mouse used as demo catalog data.",
            brand: "DemoTech",
            status: ProductStatus.ACTIVE,
        },
        create: {
            name: "Wireless Mouse",
            slug: "wireless-mouse",
            description:
                "A lightweight wireless mouse used as demo catalog data.",
            brand: "DemoTech",
            status: ProductStatus.ACTIVE,
        },
    });

    await prisma.productCategory.upsert({
        where: {
            productId_categoryId: {
                productId: mouse.id,
                categoryId: mice.id,
            },
        },
        update: {},
        create: {
            productId: mouse.id,
            categoryId: mice.id,
        },
    });

    await prisma.productCategory.upsert({
        where: {
            productId_categoryId: {
                productId: mouse.id,
                categoryId: accessories.id,
            },
        },
        update: {},
        create: {
            productId: mouse.id,
            categoryId: accessories.id,
        },
    });

    await prisma.productImage.deleteMany({
        where: {
            productId: mouse.id,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: mouse.id,
            url: "/demo/products/wireless-mouse.jpg",
            altText: "Wireless mouse",
            sortOrder: 1,
            isPrimary: true,
        },
    });

    const mouseBlack = await prisma.productVariant.upsert({
        where: {
            sku: "DEMO-MOUSE-BLK",
        },
        update: {
            productId: mouse.id,
            name: "Black",
            price: "39.99",
            compareAtPrice: null,
            currency: "USD",
            isActive: true,
        },
        create: {
            productId: mouse.id,
            name: "Black",
            sku: "DEMO-MOUSE-BLK",
            price: "39.99",
            currency: "USD",
            isActive: true,
        },
    });

    const mouseWhite = await prisma.productVariant.upsert({
        where: {
            sku: "DEMO-MOUSE-WHT",
        },
        update: {
            productId: mouse.id,
            name: "White",
            price: "39.99",
            compareAtPrice: null,
            currency: "USD",
            isActive: true,
        },
        create: {
            productId: mouse.id,
            name: "White",
            sku: "DEMO-MOUSE-WHT",
            price: "39.99",
            currency: "USD",
            isActive: true,
        },
    });

    await prisma.inventory.upsert({
        where: {
            variantId: mouseBlack.id,
        },
        update: {
            quantityAvailable: 40,
            quantityReserved: 0,
            reorderLevel: 10,
        },
        create: {
            variantId: mouseBlack.id,
            quantityAvailable: 40,
            quantityReserved: 0,
            reorderLevel: 10,
        },
    });

    await prisma.inventory.upsert({
        where: {
            variantId: mouseWhite.id,
        },
        update: {
            quantityAvailable: 32,
            quantityReserved: 0,
            reorderLevel: 10,
        },
        create: {
            variantId: mouseWhite.id,
            quantityAvailable: 32,
            quantityReserved: 0,
            reorderLevel: 10,
        },
    });

    // ============================================================
    // PRODUCT 3
    // USB Headset
    // ============================================================

    const headset = await prisma.product.upsert({
        where: {
            slug: "usb-headset",
        },
        update: {
            name: "USB Headset",
            description:
                "A simple USB headset for calls, meetings, and general desktop audio.",
            brand: "DemoAudio",
            status: ProductStatus.ACTIVE,
        },
        create: {
            name: "USB Headset",
            slug: "usb-headset",
            description:
                "A simple USB headset for calls, meetings, and general desktop audio.",
            brand: "DemoAudio",
            status: ProductStatus.ACTIVE,
        },
    });

    await prisma.productCategory.upsert({
        where: {
            productId_categoryId: {
                productId: headset.id,
                categoryId: audio.id,
            },
        },
        update: {},
        create: {
            productId: headset.id,
            categoryId: audio.id,
        },
    });

    await prisma.productImage.deleteMany({
        where: {
            productId: headset.id,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: headset.id,
            url: "/demo/products/usb-headset.jpg",
            altText: "USB headset",
            sortOrder: 1,
            isPrimary: true,
        },
    });

    const headsetStandard = await prisma.productVariant.upsert({
        where: {
            sku: "DEMO-AUDIO-USB",
        },
        update: {
            productId: headset.id,
            name: "Standard",
            price: "59.99",
            compareAtPrice: null,
            currency: "USD",
            isActive: true,
        },
        create: {
            productId: headset.id,
            name: "Standard",
            sku: "DEMO-AUDIO-USB",
            price: "59.99",
            currency: "USD",
            isActive: true,
        },
    });

    await prisma.inventory.upsert({
        where: {
            variantId: headsetStandard.id,
        },
        update: {
            quantityAvailable: 15,
            quantityReserved: 0,
            reorderLevel: 5,
        },
        create: {
            variantId: headsetStandard.id,
            quantityAvailable: 15,
            quantityReserved: 0,
            reorderLevel: 5,
        },
    });

    // ============================================================
    // PRODUCT 4
    // USB-C Hub
    // ============================================================

    const hub = await prisma.product.upsert({
        where: {
            slug: "usb-c-hub",
        },
        update: {
            name: "USB-C Hub",
            description:
                "A multi-port USB-C hub used to demonstrate a single-variant product.",
            brand: "DemoConnect",
            status: ProductStatus.ACTIVE,
        },
        create: {
            name: "USB-C Hub",
            slug: "usb-c-hub",
            description:
                "A multi-port USB-C hub used to demonstrate a single-variant product.",
            brand: "DemoConnect",
            status: ProductStatus.ACTIVE,
        },
    });

    await prisma.productCategory.upsert({
        where: {
            productId_categoryId: {
                productId: hub.id,
                categoryId: accessories.id,
            },
        },
        update: {},
        create: {
            productId: hub.id,
            categoryId: accessories.id,
        },
    });

    await prisma.productImage.deleteMany({
        where: {
            productId: hub.id,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: hub.id,
            url: "/demo/products/usb-c-hub.jpg",
            altText: "USB-C multi-port hub",
            sortOrder: 1,
            isPrimary: true,
        },
    });

    const hubStandard = await prisma.productVariant.upsert({
        where: {
            sku: "DEMO-HUB-USBC",
        },
        update: {
            productId: hub.id,
            name: "Standard",
            price: "49.99",
            compareAtPrice: "59.99",
            currency: "USD",
            isActive: true,
        },
        create: {
            productId: hub.id,
            name: "Standard",
            sku: "DEMO-HUB-USBC",
            price: "49.99",
            compareAtPrice: "59.99",
            currency: "USD",
            isActive: true,
        },
    });

    await prisma.inventory.upsert({
        where: {
            variantId: hubStandard.id,
        },
        update: {
            quantityAvailable: 22,
            quantityReserved: 0,
            reorderLevel: 5,
        },
        create: {
            variantId: hubStandard.id,
            quantityAvailable: 22,
            quantityReserved: 0,
            reorderLevel: 5,
        },
    });

    // ============================================================
    // SUMMARY
    // ============================================================

    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();
    const variantCount = await prisma.productVariant.count();
    const inventoryCount = await prisma.inventory.count();

    console.log("");
    console.log("Seed completed successfully.");
    console.log(`Categories: ${categoryCount}`);
    console.log(`Products:   ${productCount}`);
    console.log(`Variants:   ${variantCount}`);
    console.log(`Inventory:  ${inventoryCount}`);
}

main()
    .catch((error) => {
        console.error("Database seed failed.");
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });