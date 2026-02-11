import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

/**
 * GET /api/agent/qr-code?agent_id=X&format=png|svg|base64
 * Genera un QR Code de la liga de referido del agente
 */
export async function GET(request: NextRequest) {
    try {
        const agentId = request.nextUrl.searchParams.get('agent_id')
        const format = request.nextUrl.searchParams.get('format') || 'base64'

        if (!agentId) {
            return NextResponse.json({ success: false, error: 'agent_id is required' }, { status: 400 })
        }

        // Buscar agente y su referral code
        const agent = await queryOne(`
            SELECT tu.id, tu.referral_code, u.name, t.company_name, t.slug
            FROM tenant_users tu
            JOIN users u ON tu.user_id = u.id
            JOIN tenants t ON tu.tenant_id = t.id
            WHERE tu.id = $1 AND tu.is_active = true
        `, [agentId])

        if (!agent || !agent.referral_code) {
            return NextResponse.json({ success: false, error: 'Agent or referral code not found' }, { status: 404 })
        }

        // Construir URL de referido
        const baseUrl = process.env.NEXT_PUBLIC_AGENCY_BASE_URL || 'https://as-ope-viajes.company'
        const referralUrl = `${baseUrl}/?r=${agent.referral_code}`

        // QR Options con branding
        const qrOptions: QRCode.QRCodeToDataURLOptions = {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            margin: 2,
            width: 400,
            color: {
                dark: '#1A1A2E',
                light: '#FFFFFF'
            }
        }

        if (format === 'svg') {
            const svgString = await QRCode.toString(referralUrl, {
                type: 'svg',
                errorCorrectionLevel: 'M',
                margin: 2,
                width: 400,
                color: {
                    dark: '#1A1A2E',
                    light: '#FFFFFF'
                }
            })

            return new NextResponse(svgString, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Content-Disposition': `inline; filename="qr-${agent.referral_code}.svg"`,
                    'Cache-Control': 'public, max-age=3600'
                }
            })
        }

        if (format === 'png') {
            const buffer = await QRCode.toBuffer(referralUrl, {
                errorCorrectionLevel: 'M',
                type: 'png',
                margin: 2,
                width: 400,
                color: {
                    dark: '#1A1A2E',
                    light: '#FFFFFF'
                }
            })

            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': 'image/png',
                    'Content-Disposition': `inline; filename="qr-${agent.referral_code}.png"`,
                    'Cache-Control': 'public, max-age=3600'
                }
            })
        }

        // Default: base64
        const dataUrl = await QRCode.toDataURL(referralUrl, qrOptions)

        return NextResponse.json({
            success: true,
            data: {
                agent_id: agent.id,
                agent_name: agent.name,
                agency_name: agent.company_name,
                referral_code: agent.referral_code,
                referral_url: referralUrl,
                qr_code: dataUrl,
                format: 'base64'
            }
        })
    } catch (error) {
        console.error('Error generating QR code:', error)
        return NextResponse.json({
            success: false, error: (error as Error).message
        }, { status: 500 })
    }
}
