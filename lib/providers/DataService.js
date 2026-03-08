import { CSVProvider } from './CSVProvider.js';
import { SupabaseProvider } from './SupabaseProvider.js';
import path from 'path';

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
      const csvPath = path.join(process.cwd(), 'data', 'sales_data.csv');
      this.provider = new CSVProvider(csvPath);
      console.log('Data Layer: Using CSV Provider at:', csvPath);
    }
  }

  async getSalesData() {
    return await this.provider.getAll();
  }
}

export const dataService = new DataService();
