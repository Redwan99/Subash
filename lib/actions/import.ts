"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import Papa from "papaparse";
import { logAdminAction } from "@/lib/actions/admin";
import { revalidatePath } from "next/cache";

export async function importPerfumesCsv(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new Error("Unauthorized: Please log in.");
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || user.role !== Role.SUPER_ADMIN) {
            throw new Error("Forbidden: Admin access required.");
        }

        const file = formData.get("file") as File;
        if (!file) {
            throw new Error("No file provided.");
        }

        const text = await file.text();

        return new Promise((resolve, reject) => {
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const rows = results.data as Record<string, string>[];

                        // Generate slugs
                        const parseNotes = (notesStr?: string) => {
                            if (!notesStr) return [];
                            return notesStr.split(",").map((n) => n.trim()).filter(Boolean);
                        };

                        const perfumesData = rows.map((row) => {
                            const name = row.name || "Unknown";
                            const brand = row.brand || "Unknown";
                            // Slug generation: strip special chars and join with dash
                            const slug = `${brand}-${name}`
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/(^-|-$)+/g, "");

                            const topNotes = parseNotes(row.top_notes);
                            const heartNotes = parseNotes(row.heart_notes);
                            const baseNotes = parseNotes(row.base_notes);
                            const accords = parseNotes(row.accords);

                            return {
                                slug,
                                name,
                                brand,
                                image_url: row.image_url || null,
                                description: row.description || "A wonderful fragrance.",
                                top_notes: JSON.stringify(topNotes),
                                heart_notes: JSON.stringify(heartNotes),
                                base_notes: JSON.stringify(baseNotes),
                                accords: JSON.stringify(accords),
                                gender: row.gender || "Unisex",
                                release_year: row.release_year ? parseInt(row.release_year, 10) : new Date().getFullYear(),
                                searchCount: 0,
                            };
                        });

                        // Bulk insert perfumes from CSV
                        const result = await prisma.perfume.createMany({
                            data: perfumesData,
                        });

                        await logAdminAction(
                            user.id,
                            "IMPORT_CSV",
                            `Imported ${result.count} perfumes from CSV.`
                        );

                        revalidatePath("/");
                        revalidatePath("/perfume");

                        resolve({ success: true, count: result.count });
                    } catch (err: unknown) {
                        console.error("CSV Import DB Error:", err);
                        const message = err instanceof Error ? err.message : "Failed to save to database.";
                        reject(new Error(message));
                    }
                },
                error: (error: unknown) => {
                    console.error("PapaParse Error:", error);
                    reject(new Error("Failed to parse CSV file."));
                }
            });
        });
    } catch (error: unknown) {
        console.error("CSV Import Action Error:", error);
        const message = error instanceof Error ? error.message : "Upload failed.";
        return { success: false, error: message };
    }
}
