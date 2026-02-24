// API para limpiar imágenes genéricas de categoría en tours existentes
// Build: 24 Feb 2026 - v2.327
// Las imágenes de categoría (europa, asia, etc) fueron guardadas como main_image
// cuando el scraping no encontraba una imagen específica del tour.
// Este endpoint las limpia para que el próximo scrape las actualice correctamente.

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Patrones de URLs de imágenes genéricas de categoría
const GENERIC_IMAGE_PATTERNS = [
    '/covers/europa',
    '/covers/asia',
    '/covers/turquia',
    '/covers/japon',
    '/covers/corea',
    '/covers/medio-oriente',
    '/covers/dubai',
    '/covers/egipto',
    '/covers/sudamerica',
    '/covers/usa',
    '/covers/canada',
    '/covers/cruceros',
    '/covers/africa',
    '/covers/mexico',
    '/covers/balcanes',
    '/covers/centroamerica',
    '/covers/caribe',
    '/covers/alaska',
    '/covers/india',
    '/covers/china',
    '/covers/rusia',
    '/covers/australia',
    '/covers/oceania',
    '/covers/marruecos',
    '/covers/peru',
    '/covers/colombia',
    '/covers/brasil',
    '/covers/argentina',
    '/covers/chile',
    '/covers/escandinavia',
    '/covers/mediterraneo',
    '/covers/oriental',
    '/covers/norteamerica',
    '/covers/tierra-santa',
    '/covers/israel',
    '/covers/grecia',
    '/covers/italia',
    '/covers/espana',
    '/covers/francia',
];

/**
 * GET /api/admin/fix-tour-images
 * Identifica tours con imágenes genéricas de categoría
 * 
 * POST /api/admin/fix-tour-images
 * Limpia las imágenes genéricas y las reemplaza con la primera imagen de galería
 */
export async function GET() {
    try {
        // Primero buscar todos los tours con su main_image
        const result = await pool.query(`
            SELECT mt_code, name, main_image, gallery_images, map_image
            FROM megatravel_packages 
            WHERE main_image IS NOT NULL
            ORDER BY name
        `);

        const allTours = result.rows;
        const affectedTours: any[] = [];

        for (const tour of allTours) {
            const mainImage = (tour.main_image || '').toLowerCase();

            // Verificar si la main_image es genérica
            const isGeneric = GENERIC_IMAGE_PATTERNS.some(pattern =>
                mainImage.includes(pattern)
            );

            // También considerar URLs construidas que probablemente no existen
            // Pattern: https://cdnmega.com/images/viajes/covers/12345-cover.jpg
            const isConstructedCover = mainImage.match(/\/covers\/\d+-cover\.jpg$/);

            if (isGeneric || isConstructedCover) {
                const gallery = tour.gallery_images || [];
                affectedTours.push({
                    code: tour.mt_code,
                    name: tour.name,
                    currentImage: tour.main_image,
                    reason: isGeneric ? 'generic_category_cover' : 'constructed_url',
                    galleryCount: gallery.length,
                    suggestedReplacement: gallery.length > 0 ? gallery[0] : null
                });
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                totalTours: allTours.length,
                affectedTours: affectedTours.length,
                withGalleryFallback: affectedTours.filter(t => t.suggestedReplacement).length,
                withoutFallback: affectedTours.filter(t => !t.suggestedReplacement).length,
            },
            affected: affectedTours
        });
    } catch (error: any) {
        console.error('Error checking tour images:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await pool.query(`
            SELECT mt_code, name, main_image, gallery_images
            FROM megatravel_packages 
            WHERE main_image IS NOT NULL
            ORDER BY name
        `);

        const allTours = result.rows;
        const fixed: any[] = [];
        const noFix: any[] = [];

        for (const tour of allTours) {
            const mainImage = (tour.main_image || '').toLowerCase();

            const isGeneric = GENERIC_IMAGE_PATTERNS.some(pattern =>
                mainImage.includes(pattern)
            );
            const isConstructedCover = mainImage.match(/\/covers\/\d+-cover\.jpg$/);

            if (isGeneric || isConstructedCover) {
                const gallery = tour.gallery_images || [];

                if (gallery.length > 0) {
                    // Reemplazar con primera imagen de galería
                    await pool.query(
                        `UPDATE megatravel_packages SET main_image = $1, updated_at = NOW() WHERE mt_code = $2`,
                        [gallery[0], tour.mt_code]
                    );
                    fixed.push({
                        code: tour.mt_code,
                        name: tour.name,
                        oldImage: tour.main_image,
                        newImage: gallery[0]
                    });
                } else {
                    // Sin galería, poner null para que el próximo scrape la actualice
                    await pool.query(
                        `UPDATE megatravel_packages SET main_image = NULL, updated_at = NOW() WHERE mt_code = $1`,
                        [tour.mt_code]
                    );
                    noFix.push({
                        code: tour.mt_code,
                        name: tour.name,
                        oldImage: tour.main_image,
                        action: 'cleared - will be updated on next scrape'
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                totalChecked: allTours.length,
                fixed: fixed.length,
                cleared: noFix.length,
            },
            fixed,
            cleared: noFix
        });
    } catch (error: any) {
        console.error('Error fixing tour images:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
