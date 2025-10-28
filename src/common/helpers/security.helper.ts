import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export const compareHashBcrypt = async (plain: string, hash: string) => {
  return bcrypt.compare(plain, hash);
};

export const hashBcrypt = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const hashTokenSHA256 = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
