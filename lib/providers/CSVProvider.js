import fs from 'fs';
import csv from 'csv-parser';

export class CSVProvider {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async getAll() {
    return new Promise((resolve, reject) => {
      const results = [];
      if (!fs.existsSync(this.filePath)) {
        return reject(new Error('CSV file not found'));
      }

      fs.createReadStream(this.filePath)
        .pipe(csv())
        .on('data', (data) => {
          const transformed = {};
          for (const [key, value] of Object.entries(data)) {
            const num = Number(value);
            transformed[key] = isNaN(num) || value === '' ? value : num;
          }
          results.push(transformed);
        })
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }
}
