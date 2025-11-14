/**
 * Expense Helper Functions
 * Contains utility functions for expense operations
 */

const ExpenseHelper = {
  /**
   * Calculate total expenses
   */
  calculateTotalExpense: (expenses) => {
    if (!Array.isArray(expenses)) return 0;
    return expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
  },

  /**
   * Format expense date
   */
  formatExpenseDate: (date) => {
    return new Date(date).toISOString().split('T')[0];
  },

  /**
   * Validate expense amount
   */
  validateAmount: (amount) => {
    return !isNaN(amount) && amount > 0;
  },

  /**
   * Get expense status
   */
  getExpenseStatus: (status) => {
    const validStatuses = ["pending", "approved", "rejected", "completed"];
    return validStatuses.includes(status) ? status : "pending";
  },

  /**
   * Filter expenses by date range
   */
  filterByDateRange: (expenses, startDate, endDate) => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });
  },

  /**
   * Group expenses by category
   */
  groupByCategory: (expenses) => {
    return expenses.reduce((grouped, expense) => {
      const category = expense.category || "other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(expense);
      return grouped;
    }, {});
  },
};

export default ExpenseHelper;
