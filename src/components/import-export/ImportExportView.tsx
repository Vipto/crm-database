import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  FileText,
  Database,
  Trash2,
} from 'lucide-react';
import { parseSellerCSV, exportSellersToCSV } from '../../lib/utils/csv';
import { checkSellerDuplicates, bulkImportSellers, getSellersPaginated } from '../../lib/db/sellers';
import { CSVImportRow, Seller } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';

export const ImportExportView: React.FC = () => {
  const { currentUser, canImportSellers } = useAuth();
  const { success, error, info, warning } = useToast();
  const { triggerRefresh } = useCRM();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CSVImportRow[]>([]);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCsvFile(file);
      setScanning(true);
      info('Parsing CSV File...', 'Validating rows and detecting duplicate records against database.');

      const rows = await parseSellerCSV(file);

      // Perform duplicate detection on each row
      const verifiedRows: CSVImportRow[] = [];
      for (const row of rows) {
        if (!row._isValid) {
          verifiedRows.push(row);
          continue;
        }

        const dup = await checkSellerDuplicates({
          phone: row.phone,
          whatsapp: row.whatsapp,
          email: row.email,
          shopName: row.shopName,
          city: row.city,
        });

        if (dup.isDuplicate && dup.existingSeller) {
          verifiedRows.push({
            ...row,
            _isDuplicate: true,
            _duplicateReason: dup.message,
            _existingSellerId: dup.existingSeller.id,
          });
        } else {
          verifiedRows.push({ ...row, _isDuplicate: false });
        }
      }

      setParsedRows(verifiedRows);
      const validCount = verifiedRows.filter((r) => r._isValid && !r._isDuplicate).length;
      const dupCount = verifiedRows.filter((r) => r._isDuplicate).length;
      const errCount = verifiedRows.filter((r) => !r._isValid).length;

      success('CSV Processed', `Found ${validCount} clean records, ${dupCount} duplicates, ${errCount} validation errors.`);
    } catch (err: any) {
      error('Failed to parse CSV', err?.message || 'Error processing file');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmImport = async (includeDuplicates: boolean = false) => {
    if (!canImportSellers) {
      error('Permission Denied', 'Only Admins can import bulk records.');
      return;
    }

    const recordsToImport = parsedRows.filter((r) => {
      if (!r._isValid) return false;
      if (!includeDuplicates && r._isDuplicate) return false;
      return true;
    });

    if (recordsToImport.length === 0) {
      warning('No Valid Records', 'No valid records to import.');
      return;
    }

    try {
      setImporting(true);
      info('Importing Records', `Writing ${recordsToImport.length} sellers to Cloud Firestore...`);

      const count = await bulkImportSellers(
        recordsToImport as any,
        currentUser,
        (done, total) => setImportProgress(Math.round((done / total) * 100))
      );

      success('Import Complete!', `Successfully imported ${count} sellers into Vipto CRM.`);
      setCsvFile(null);
      setParsedRows([]);
      triggerRefresh();
    } catch (err: any) {
      error('Import failed', err?.message);
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const handleFullExport = async () => {
    try {
      setExporting(true);
      info('Preparing Export', 'Fetching records from Firestore database...');
      const res = await getSellersPaginated({ pageSize: 500 });
      exportSellersToCSV(res.sellers, `vipto-all-sellers-${Date.now()}.csv`);
      success('Export Completed', `Exported ${res.sellers.length} records to CSV.`);
    } catch (err: any) {
      error('Export failed', err?.message);
    } finally {
      setExporting(false);
    }
  };

  const validRows = parsedRows.filter((r) => r._isValid && !r._isDuplicate);
  const duplicateRows = parsedRows.filter((r) => r._isDuplicate);
  const errorRows = parsedRows.filter((r) => !r._isValid);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800/80 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vipto-500/10 border border-vipto-500/20 text-vipto-300 text-xs font-medium">
            <FileSpreadsheet className="w-3.5 h-3.5 text-vipto-400" />
            <span>Bulk Data Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-['Outfit']">
            CSV Import & Export Engine
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Import hundreds or thousands of merchant records with live duplicate detection and validation guards.
          </p>
        </div>

        <button
          onClick={handleFullExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold shadow-lg transition-all hover:scale-105 shrink-0"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>{exporting ? 'Exporting...' : 'Export All Sellers (CSV)'}</span>
        </button>
      </div>

      {/* Upload Box */}
      {!csvFile && (
        <div className="p-8 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 hover:border-vipto-500/50 transition-colors text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-vipto-600/10 border border-vipto-500/20 text-vipto-400 flex items-center justify-center mx-auto shadow-glow">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-white">Upload Seller CSV File</h3>
              <p className="text-xs text-slate-400 mt-1">
                CSV headers like "Seller Name", "Shop Name", "Phone", "Category", "City", "State" will be auto-mapped.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white font-semibold text-xs shadow-lg shadow-vipto-900/40 cursor-pointer transition-all hover:scale-105">
              <FileText className="w-4 h-4" />
              <span>Select CSV Document</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      )}

      {/* CSV Processing Results & Preview */}
      {parsedRows.length > 0 && (
        <div className="space-y-5">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-slate-400">Total Rows</span>
              <div className="text-xl font-bold text-white">{parsedRows.length}</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready to Import</span>
              </span>
              <div className="text-xl font-bold text-emerald-300">{validRows.length}</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1">
              <span className="text-amber-400 font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Duplicates Detected</span>
              </span>
              <div className="text-xl font-bold text-amber-300">{duplicateRows.length}</div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1">
              <span className="text-rose-400 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Validation Errors</span>
              </span>
              <div className="text-xl font-bold text-rose-300">{errorRows.length}</div>
            </div>
          </div>

          {/* Import Action Buttons */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCsvFile(null);
                  setParsedRows([]);
                }}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                Clear & Choose Another File
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              {duplicateRows.length > 0 && (
                <button
                  onClick={() => handleConfirmImport(true)}
                  disabled={importing}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold transition-colors"
                >
                  Import All (Including Duplicates)
                </button>
              )}

              <button
                onClick={() => handleConfirmImport(false)}
                disabled={importing || validRows.length === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white font-semibold shadow-lg shadow-vipto-900/40 disabled:opacity-50 transition-all hover:scale-105"
              >
                <Database className="w-4 h-4" />
                <span>
                  {importing
                    ? `Importing (${importProgress}%)...`
                    : `Import ${validRows.length} Verified Records`}
                </span>
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
            <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-300">
              CSV Row Preview (First 20 records)
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Shop Name</th>
                    <th className="py-3 px-4">Owner Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Notes / Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {parsedRows.slice(0, 20).map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/30 ${
                        !row._isValid
                          ? 'bg-rose-950/10'
                          : row._isDuplicate
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        {!row._isValid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        ) : row._isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <ShieldAlert className="w-3 h-3" /> Duplicate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{row.shopName}</td>
                      <td className="py-3 px-4">{row.name}</td>
                      <td className="py-3 px-4 font-mono">{row.phone}</td>
                      <td className="py-3 px-4">{row.city}</td>
                      <td className="py-3 px-4">{row.category}</td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {row._errors && row._errors.length > 0
                          ? row._errors.join(', ')
                          : row._duplicateReason || 'Ready'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
