import { PayOS } from '@payos/node';

let client = null;

/**
 * Trả về client PayOS nếu đủ biến môi trường; ngược lại null (COD vẫn hoạt động).
 */
export function getPayOS() {
    if (client) return client;
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    if (!clientId || !apiKey || !checksumKey) {
        return null;
    }
    const baseURL = (process.env.PAYOS_BASE_URL || process.env.PAYOS_ENDPOINT || '')
        .trim()
        .replace(/\/$/, '');
    const opts = {
        clientId,
        apiKey,
        checksumKey,
    };
    if (baseURL) {
        opts.baseURL = baseURL;
    }
    client = new PayOS(opts);
    return client;
}

export function getPublicBaseUrl() {
    return (
        process.env.APP_PUBLIC_URL ||
        process.env.FRONTEND_URL ||
        process.env.APP_URL ||
        'http://localhost:3000'
    ).replace(/\/$/, '');
}

/**
 * URL redirect sau thanh toán / khi hủy (PayOS).
 * - Nếu set PAYOS_RETURN_URL / PAYOS_CANCEL_URL: dùng (vẫn append orderId).
 * - Không set: {APP_PUBLIC_URL}/checkout/payos/return|cancel
 */
function buildPayosRedirect(envUrl, defaultPath, orderId) {
    const base = getPublicBaseUrl();
    const oid = encodeURIComponent(String(orderId));
    const raw = (envUrl || '').trim().replace(/^["']|["']$/g, '');
    if (raw) {
        const u = raw.replace(/\/$/, '');
        return u.includes('?') ? `${u}&orderId=${oid}` : `${u}?orderId=${oid}`;
    }
    const path = defaultPath.startsWith('/') ? defaultPath : `/${defaultPath}`;
    return `${base}${path}?orderId=${oid}`;
}

export function buildPayosReturnUrl(orderId) {
    return buildPayosRedirect(process.env.PAYOS_RETURN_URL, '/checkout/payos/return', orderId);
}

export function buildPayosCancelUrl(orderId) {
    return buildPayosRedirect(process.env.PAYOS_CANCEL_URL, '/checkout/payos/cancel', orderId);
}
