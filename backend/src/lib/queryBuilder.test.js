// Unit tests for queryBuilder
import { strict as assert } from 'assert';
import { buildQuery } from './queryBuilder.js';

describe('queryBuilder', () => {
  describe('buildQuery - Basic functionality', () => {
    it('should build a simple query with no filters', () => {
      const result = buildQuery({
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('SELECT'));
      assert(result.main.includes('FROM records'));
      assert(result.main.includes('LIMIT'));
      assert.strictEqual(result.mainValues[result.mainValues.length - 2], 25); // pageSize
      assert.strictEqual(result.mainValues[result.mainValues.length - 1], 0);  // offset
    });

    it('should handle pagination correctly', () => {
      const result = buildQuery({
        page: 2,
        pageSize: 50
      });
      
      assert.strictEqual(result.mainValues[result.mainValues.length - 2], 50); // pageSize
      assert.strictEqual(result.mainValues[result.mainValues.length - 1], 50); // offset = (2-1) * 50
    });

    it('should generate count query', () => {
      const result = buildQuery({
        page: 1,
        pageSize: 25
      });
      
      assert(result.count.includes('SELECT COUNT(*) AS total'));
      assert(result.count.includes('FROM records'));
    });
  });

  describe('buildQuery - Text filters', () => {
    it('should handle "contains" filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'Brand', op: 'contains', value: 'BMW' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('LIKE'));
      assert(result.mainValues.some(v => v === '%BMW%'));
    });

    it('should handle "equals" filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'Brand', op: 'equals', value: 'Tesla' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('='));
      assert(result.mainValues.includes('Tesla'));
    });

    it('should handle "notContains" filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'Model', op: 'notContains', value: 'Sport' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('NOT LIKE'));
      assert(result.mainValues.some(v => v === '%Sport%'));
    });

    it('should handle "startsWith" filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'Brand', op: 'startsWith', value: 'Audi' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('LIKE'));
      assert(result.mainValues.some(v => v === 'Audi%'));
    });

    it('should handle "endsWith" filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'Model', op: 'endsWith', value: 'Pro' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('LIKE'));
      assert(result.mainValues.some(v => v === '%Pro'));
    });
  });

  describe('buildQuery - Numeric filters', () => {
    it('should handle "gt" (greater than) filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'PriceEuro', op: 'gt', value: '50000' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('>'));
      assert(result.mainValues.includes('50000'));
    });

    it('should handle "lt" (less than) filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'Range_Km', op: 'lt', value: '300' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('<'));
      assert(result.mainValues.includes('300'));
    });

    it('should handle numeric equals filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'Seats', op: 'equals', value: '5' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('='));
      assert(result.mainValues.includes('5'));
    });
  });

  describe('buildQuery - IN filter', () => {
    it('should handle "in" filter with multiple values', () => {
      const result = buildQuery({
        filters: [
          { field: 'Brand', op: 'in', values: ['BMW', 'Audi', 'Tesla'] }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('IN'));
      assert(result.mainValues.includes('BMW'));
      assert(result.mainValues.includes('Audi'));
      assert(result.mainValues.includes('Tesla'));
    });

    it('should handle empty "in" filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'Brand', op: 'in', values: [] }
        ],
        page: 1,
        pageSize: 25
      });
      
      // Should not add filter condition for empty array
      assert(result.main);
      assert.strictEqual(result.mainValues.filter(v => v === 'BMW').length, 0);
    });
  });

  describe('buildQuery - isEmpty/notEmpty filters', () => {
    it('should handle "isEmpty" filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'Model', op: 'isEmpty' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('IS NULL') || result.main.includes("= ''"));
    });

    it('should handle "notEmpty" filter', () => {
      const result = buildQuery({
        filters: [
          { field: 'Brand', op: 'notEmpty' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('NOT ('));
    });
  });

  describe('buildQuery - Sorting', () => {
    it('should handle ascending sort', () => {
      const result = buildQuery({
        sortField: 'Brand',
        sortOrder: 'asc',
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('ORDER BY'));
      assert(result.main.includes('ASC'));
    });

    it('should handle descending sort', () => {
      const result = buildQuery({
        sortField: 'PriceEuro',
        sortOrder: 'desc',
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('ORDER BY'));
      assert(result.main.includes('DESC'));
    });

    it('should handle numeric field sorting', () => {
      const result = buildQuery({
        sortField: 'Range_Km',
        sortOrder: 'asc',
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('ORDER BY'));
      assert(result.main.includes('DECIMAL'));
      assert(result.main.includes('Range_Km'));
    });

    it('should handle date field sorting', () => {
      const result = buildQuery({
        sortField: 'Date',
        sortOrder: 'desc',
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('ORDER BY'));
      assert(result.main.includes('STR_TO_DATE'));
    });
  });

  describe('buildQuery - Search functionality', () => {
    it('should handle search query', () => {
      const result = buildQuery({
        q: 'Tesla Model 3',
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('LIKE'));
      assert(result.mainValues.some(v => v && v.includes('Tesla Model 3')));
    });

    it('should combine search with filters', () => {
      const result = buildQuery({
        q: 'Electric',
        filters: [
          { field: 'Brand', op: 'equals', value: 'BMW' }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('LIKE'));
      assert(result.main.includes('='));
      assert(result.mainValues.some(v => v && v.includes('Electric')));
      assert(result.mainValues.includes('BMW'));
    });

    it('should handle empty search string', () => {
      const result = buildQuery({
        q: '   ',
        page: 1,
        pageSize: 25
      });
      
      // Empty search should not add WHERE clause
      assert(!result.main.includes('WHERE'));
    });
  });

  describe('buildQuery - Security (Field Validation)', () => {
    it('should reject invalid field names in filters', () => {
      const result = buildQuery({
        filters: [
          { field: 'Brand; DROP TABLE records;--', op: 'equals', value: 'test' }
        ],
        page: 1,
        pageSize: 25
      });
      
      // Invalid field should be ignored, no filter added
      assert(!result.main.includes('DROP'));
    });

    it('should use parameterized queries for values', () => {
      const result = buildQuery({
        filters: [
          { field: 'Brand', op: 'equals', value: "'; DROP TABLE records;--" }
        ],
        page: 1,
        pageSize: 25
      });
      
      // Value should be in params array, not concatenated in SQL
      assert(result.mainValues.includes("'; DROP TABLE records;--"));
      assert(!result.main.includes("DROP TABLE"));
    });

    it('should validate sortField against safe field pattern', () => {
      const result = buildQuery({
        sortField: 'Brand; DELETE FROM records',
        sortOrder: 'asc',
        page: 1,
        pageSize: 25
      });
      
      // Invalid sort field should be ignored
      assert(!result.main.includes('DELETE'));
    });

    it('should allow valid alphanumeric field names', () => {
      const result = buildQuery({
        filters: [
          { field: 'Range_Km', op: 'gt', value: '300' }
        ],
        sortField: 'PriceEuro',
        sortOrder: 'desc',
        page: 1,
        pageSize: 25
      });
      
      // Valid fields should be processed
      assert(result.main.includes('Range_Km'));
      assert(result.main.includes('PriceEuro'));
    });
  });

  describe('buildQuery - Multiple filters', () => {
    it('should handle multiple filters with AND logic', () => {
      const result = buildQuery({
        filters: [
          { field: 'Brand', op: 'equals', value: 'BMW' },
          { field: 'Range_Km', op: 'gt', value: '400' },
          { field: 'BodyStyle', op: 'in', values: ['SUV', 'Sedan'] }
        ],
        page: 1,
        pageSize: 25
      });
      
      assert(result.main.includes('AND'));
      assert(result.mainValues.includes('BMW'));
      assert(result.mainValues.includes('400'));
      assert(result.mainValues.includes('SUV'));
      assert(result.mainValues.includes('Sedan'));
    });

    it('should combine multiple filters with search and sorting', () => {
      const result = buildQuery({
        q: 'electric',
        filters: [
          { field: 'Brand', op: 'equals', value: 'Tesla' },
          { field: 'PriceEuro', op: 'lt', value: '100000' }
        ],
        sortField: 'Range_Km',
        sortOrder: 'desc',
        page: 2,
        pageSize: 50
      });
      
      assert(result.main.includes('LIKE')); // search
      assert(result.main.includes('=')); // equals filter
      assert(result.main.includes('<')); // less than filter
      assert(result.main.includes('ORDER BY')); // sorting
      assert(result.mainValues.some(v => v && v.includes('electric')));
      assert(result.mainValues.includes('Tesla'));
      assert(result.mainValues.includes('100000'));
    });
  });

  describe('buildQuery - Edge cases', () => {
    it('should handle undefined filters', () => {
      const result = buildQuery({
        filters: undefined,
        page: 1,
        pageSize: 25
      });
      
      assert(result.main);
      assert(result.mainValues);
    });

    it('should handle negative page numbers', () => {
      const result = buildQuery({
        page: -1,
        pageSize: 25
      });
      
      // Should default to page 1 (offset 0)
      assert.strictEqual(result.mainValues[result.mainValues.length - 1], 0);
    });

    it('should cap excessive page size', () => {
      const result = buildQuery({
        page: 1,
        pageSize: 10000
      });
      
      // Should cap at 200
      assert.strictEqual(result.mainValues[result.mainValues.length - 2], 200);
    });

    it('should handle zero page size', () => {
      const result = buildQuery({
        page: 1,
        pageSize: 0
      });
      
      // Should default to minimum of 1 (or the default which is 25)
      const pageSize = result.mainValues[result.mainValues.length - 2];
      assert(pageSize >= 1, 'Page size should be at least 1');
    });

    it('should handle noLimit option', () => {
      const result = buildQuery({
        noLimit: true,
        page: 1,
        pageSize: 25
      });
      
      // Should not include LIMIT clause
      assert(!result.main.includes('LIMIT'));
    });
  });
});
