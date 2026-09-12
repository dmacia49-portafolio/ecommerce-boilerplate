import { ProductStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function findActiveProducts() {
    return prisma.product.findMany({
        where: {
            status: ProductStatus.ACTIVE,
        },

        include: {
            images: {
                orderBy: {
                    sortOrder: "asc",
                },
            },

            variants: {
                where: {
                    isActive: true,
                },

                include: {
                    inventory: true,
                },

                orderBy: {
                    price: "asc",
                },
            },
        },

        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function findActiveProductBySlug(slug: string) {
    return prisma.product.findFirst({
        where: {
            slug,
            status: ProductStatus.ACTIVE,
        },

        include: {
            images: {
                orderBy: {
                    sortOrder: "asc",
                },
            },

            categories: {
                include: {
                    category: true,
                },
            },

            variants: {
                where: {
                    isActive: true,
                },

                include: {
                    inventory: true,
                },

                orderBy: {
                    price: "asc",
                },
            },
        },
    });
}