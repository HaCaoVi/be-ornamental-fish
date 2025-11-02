import { Request } from "express";

export const buildMeta = (
  current: number,
  pageSize: number,
  totalItems: number,
) => {
  return {
    current,
    pageSize,
    total: totalItems,
    pages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
};

export const getClientIp = (req: Request): string => {
  let ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '';

  // Chuẩn hóa IPv6 dạng "::ffff:192.168.1.10" → "192.168.1.10"
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // Xử lý trường hợp "::1" (localhost IPv6)
  if (ip === '::1') {
    ip = '127.0.0.1';
  }

  return ip;
}
