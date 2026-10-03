import Papa from 'papaparse';
import { CSVImportRow, Seller } from '../../types';
import { isValidIndianPhone, isValidEmail, cleanPhoneNumber } from './validation';
import { formatCRMDate } from './formatters';

/**
 * Maps arbitrary CSV headers to standard Vipto CRM fields
 */
function normalizeHeader(header: string): string {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (h.includes('seller') || h.includes('owner') || h.includes('contactperson') || h === 'name') return 'name';
  if (h.includes('shop') || h.includes('store') || h.includes('business') || h.includes('company')) return 'shopName';
  if (h.includes('phone') || h.includes('mobile') || h.includes('contactnumber') || h.includes('cell')) return 'phone';
  if (h.includes('whatsapp') || h.includes('wa')) return 'whatsapp';
  if (h.includes('email') || h.includes('mail')) return 'email';
  if (h.includes('category') || h.includes('segment') || h.includes('vertical')) return 'category';
  if (h.includes('city') || h.includes('town')) return 'city';
  if (h.includes('state') || h.includes('region')) return 'state';
  if (h.includes('area') || h.includes('locality') || h.includes('suburb')) return 'area';
  if (h.includes('address') || h.includes('street')) return 'address';
  if (h.includes('status')) return 'sellerStatus';
  if (h.includes('priority')) return 'priority';
  if (h.includes('source') || h.includes('leadsource')) return 'leadSource';
  if (h.includes('note') || h.includes('comment') || h.includes('description')) return 'notes';
  return header;
}

/**
 * Parse CSV file into structured rows with validation
 */
export async function parseSellerCSV(file: File): Promise<CSVImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalizeHeader(header),
      complete: (results) => {
        const rows: CSVImportRow[] = (results.data as any[]).map((row, index) => {
          const errors: string[] = [];
          
          const name = (row.name || '').trim();
          const shopName = (row.shopName || '').trim();
          const phone = cleanPhoneNumber(row.phone || '');
          const email = (row.email || '').trim();
          const category = (row.category || 'General').trim();
          const city = (row.city || '').trim();

          if (!name && !shopName) {
            errors.push('Either Seller Name or Shop Name is required');
          }
          if (!phone) {
            errors.push('Phone number is required');
          } else if (!isValidIndianPhone(phone)) {
            errors.push('Invalid phone number format (must be 10 digits)');
          }
          if (email && !isValidEmail(email)) {
            errors.push('Invalid email format');
          }
          if (!city) {
            errors.push('City is required');
          }

          return {
            name: name || shopName,
            shopName: shopName || name,
            phone: phone,
            whatsapp: cleanPhoneNumber(row.whatsapp || '') || phone,
            email: email || undefined,
            category: category || 'Fashion',
            city: city,
            state: (row.state || '').trim(),
            area: (row.area || '').trim(),
            address: (row.address || '').trim(),
            sellerStatus: row.sellerStatus || 'New',
            priority: row.priority || 'Medium',
            leadSource: row.leadSource || 'CSV Import',
            notes: (row.notes || '').trim(),
            _isValid: errors.length === 0,
            _errors: errors,
          };
        });

        resolve(rows);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * Export a list of sellers into a downloaded CSV file
 */
export function exportSellersToCSV(sellers: Seller[], filename: string = 'vipto-sellers-export.csv') {
  const exportData = sellers.map(s => ({
    'Seller Name': s.name,
    'Shop Name': s.shopName,
    'Phone': s.phone,
    'WhatsApp': s.whatsapp || s.phone,
    'Email': s.email || '',
    'Category': s.category,
    'Subcategory': s.subcategory || '',
    'City': s.city,
    'State': s.state || '',
    'Area': s.area || '',
    'Address': s.address || '',
    'Seller Status': s.sellerStatus,
    'Contact Status': s.contactStatus,
    'Onboarding Status': s.onboardingStatus,
    'Assigned Employee': s.assignedEmployeeName || 'Unassigned',
    'Lead Source': s.leadSource,
    'Priority': s.priority,
    'Last Contacted': formatCRMDate(s.lastContactedAt),
    'Next Follow-Up': formatCRMDate(s.nextFollowUpAt),
    'Created Date': formatCRMDate(s.createdAt),
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
