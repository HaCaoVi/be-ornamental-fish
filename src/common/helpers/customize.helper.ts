export const buildMeta = (current: number, pageSize: number, totalItems: number) => {
    return {
        current,
        pageSize,
        total: totalItems,
        pages: Math.max(1, Math.ceil(totalItems / pageSize)),
    };
}
