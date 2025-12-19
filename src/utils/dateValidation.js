import { getActivePeriod } from "../modules/period/service.js";
import ApiError from "./ApiError.js";

/**
 * Validates that an expense date is not before the active accounting period's start date.
 * @param {Date|string} dateInput - The date of the expense.
 * @param {string} dateFieldName - The name of the date field for better error reporting.
 * @param {boolean} isMonthOnly - If true, only compares year and month (useful for salaries).
 * @throws {ApiError} - If the date is before the active period.
 */
export const validateExpenseDate = async (dateInput, dateFieldName = "Date", isMonthOnly = false) => {
    if (!dateInput) return;


    const activePeriod = await getActivePeriod();
    if (!activePeriod || !activePeriod.startDate) return;

    const inputDate = new Date(dateInput);
    const startDate = new Date(activePeriod.startDate);

    inputDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    if (isMonthOnly) {
        // Compare year and month only
        const inputYearMonth = inputDate.getFullYear() * 12 + inputDate.getMonth();
        const startYearMonth = startDate.getFullYear() * 12 + startDate.getMonth();

        if (inputYearMonth < startYearMonth) {
            throw ApiError.badRequest(
                `Expense ${dateFieldName} (${dateInput}) cannot be before the active month (${startDate.toLocaleString('default', { month: 'long', year: 'numeric' })}).`
            );
        }
        return;
    }

    if (inputDate < startDate) {

        throw ApiError.badRequest(
            `Expense ${dateFieldName} (${inputDate.toLocaleDateString()}) cannot be before the active month start date (${startDate.toLocaleDateString()}).`
        );
    }
};
 