import bcrypt from "bcryptjs";

export const compareHashBcrypt = async (plain: string, hash: string) => {
    return bcrypt.compare(plain, hash);
}

export const hashBcrypt = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}