import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export function isPrivateIpAddress(address: string): boolean {
  let sanitized = address.trim().toLowerCase();

  if (isIP(sanitized) === 6) {
    try {
      sanitized = new URL(`http://[${sanitized}]`).hostname.replace(/^\[|\]$/g, '');
    } catch {
      // Keep the original normalized string if URL parsing rejects it.
    }
  }

  if (sanitized.startsWith('::ffff:')) {
    const mapped = sanitized.slice('::ffff:'.length);
    if (mapped.includes('.')) {
      return isPrivateIpAddress(mapped);
    }

    const [high, low] = mapped.split(':').map((part) => parseInt(part, 16));
    if (Number.isFinite(high) && Number.isFinite(low)) {
      return isPrivateIpAddress([
        (high >> 8) & 255,
        high & 255,
        (low >> 8) & 255,
        low & 255,
      ].join('.'));
    }
  }

  if (isIP(sanitized) === 4) {
    const [first, second, third] = sanitized.split('.').map(Number);
    return first === 0
      || first === 10
      || first === 127
      || (first === 100 && second >= 64 && second <= 127)
      || (first === 169 && second === 254)
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 0 && third === 0)
      || (first === 192 && second === 168)
      || (first === 198 && (second === 18 || second === 19))
      || (first === 198 && second === 51 && third === 100)
      || (first === 203 && second === 0 && third === 113)
      || first >= 224;
  }

  if (isIP(sanitized) === 6) {
    const firstHextet = parseInt(sanitized.split(':')[0] || '0', 16);
    return sanitized === '::1'
      || sanitized === '::'
      || sanitized.startsWith('fc')
      || sanitized.startsWith('fd')
      || (firstHextet >= 0xfe80 && firstHextet <= 0xfebf)
      || sanitized.startsWith('ff')
      || sanitized.startsWith('2001:db8:');
  }

  return false;
}

export async function validateMediaDownloadUrl(value: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return 'Invalid media URL';
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Media URL must use http or https';
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return 'Media URL host is not allowed';
  }

  if (isIP(hostname)) {
    return isPrivateIpAddress(hostname) ? 'Media URL host is not allowed' : null;
  }

  let addresses;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    return 'Media URL host could not be resolved';
  }
  if (addresses.some(({ address }) => isPrivateIpAddress(address))) {
    return 'Media URL host is not allowed';
  }

  return null;
}
