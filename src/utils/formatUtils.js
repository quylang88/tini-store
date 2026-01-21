/**
 * Common formatter for currency (VND)
 */
export const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0₫';
    const number = Number(value);
    if (!Number.isFinite(number)) return '0₫';
    return number.toLocaleString('vi-VN') + '₫';
};
