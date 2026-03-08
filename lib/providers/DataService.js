import { CSVProvider } from './CSVProvider.js';
import { SupabaseProvider } from './SupabaseProvider.js';
import dotenv from 'dotenv';

dotenv.config();

class DataService {
  constructor() {
    const sourceType = process.env.DATA_SOURCE || 'csv';
    
    if (sourceType === 'supabase') {
      this.provider = new SupabaseProvider(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      console.log('Data Layer: Using Supabase Provider');
    } else {
      this.provider = new CSVProvider('./data/sales_data.csv');
      console.log('Data Layer: Using CSV Provider');
    }
  }

  async getSalesData() {
    return await this.provider.getAll();
  }
}

export const dataService = new DataService();
