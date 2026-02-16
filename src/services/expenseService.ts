import { supabase } from './supabaseClient';
import { Expense } from '../types';

// Normalize DB fields to camelCase
const normalizeExpense = (row: any): Expense => ({
  id: row.id,
  title: row.title,
  amount: Number(row.amount),
  category: row.category,
  date: row.date,
  description: row.description,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

// Fetch all expenses
export const fetchExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }

  return (data || []).map(normalizeExpense);
};

// Add new expense
export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      description: expense.description || null,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding expense:', error);
    throw error;
  }

  return normalizeExpense(data);
};

// Update expense
export const updateExpense = async (expense: Expense): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      description: expense.description || null,
    })
    .eq('id', expense.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating expense:', error);
    throw error;
  }

  return normalizeExpense(data);
};

// Delete expense
export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Get expenses by date range
export const getExpensesByDateRange = async (startDate: string, endDate: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses by date range:', error);
    throw error;
  }

  return (data || []).map(normalizeExpense);
};

// Get expenses summary by category
export const getExpensesSummary = async (startDate?: string, endDate?: string): Promise<{ category: string; total: number }[]> => {
  let query = supabase.from('expenses').select('category, amount');

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching expenses summary:', error);
    throw error;
  }

  // Group by category
  const summary: Record<string, number> = {};
  (data || []).forEach(row => {
    const cat = row.category || 'diğer';
    summary[cat] = (summary[cat] || 0) + Number(row.amount);
  });

  return Object.entries(summary).map(([category, total]) => ({ category, total }));
};
