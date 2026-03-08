import { createClient } from '@supabase/supabase-js';

export class SupabaseProvider {
  constructor(url, key) {
    if (!url || !key) {
      this.client = null;
      console.warn('Supabase credentials missing. SupabaseProvider will not be functional.');
    } else {
      this.client = createClient(url, key);
    }
  }

  async getAll() {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Check your .env credentials.');
    }

    const { data, error } = await this.client
      .from('sales_data')
      .select('*');

    if (error) {
      throw error;
    }

    return data;
  }
}
