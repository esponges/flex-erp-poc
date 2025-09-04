import { useState, useRef, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
  importType: 'initial' | 'replace';
}

interface ImportResult {
  status: 'processing' | 'completed' | 'error';
  message: string;
  detectedColumns?: string[];
  rowCount?: number;
  estimatedTime?: string;
}

export function FileImportModal({ isOpen, onClose, onImportSuccess, importType }: FileImportModalProps) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mockAISchemaDetection = useCallback((): ImportResult => {
    // Mock AI response based on file type and name
    const columns = ['SKU Code', 'Product Name', 'Category', 'Quantity', 'Unit Cost', 'Supplier', 'Description'];
    const estimatedRows = Math.floor(Math.random() * 1000) + 100;
    
    return {
      status: 'processing',
      message: t('fileImport.progress.processingMessage'),
      detectedColumns: columns,
      rowCount: estimatedRows,
      estimatedTime: `${Math.ceil(estimatedRows / 100)} minutes`
    };
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx?)$/i)) {
      alert(t('fileImport.validation.invalidFileType'));
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert(t('fileImport.validation.fileTooLarge'));
      return false;
    }
    
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    // Mock AI processing
    const initialResult = mockAISchemaDetection();
    setImportResult(initialResult);
    
    // Simulate processing time
    setTimeout(() => {
      setImportResult({
        status: 'completed',
        message: `Successfully processed ${initialResult.rowCount} rows. Your import is complete!`,
        detectedColumns: initialResult.detectedColumns!,
        rowCount: initialResult.rowCount!
      });
      setIsUploading(false);
      
      // Auto-close after success
      setTimeout(() => {
        onImportSuccess?.();
        handleClose();
      }, 2000);
    }, 3000);
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setIsUploading(false);
    setDragActive(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {importType === 'initial' ? t('fileImport.modal.initialImport') : t('fileImport.modal.replaceInventory')}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isUploading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!importResult ? (
            <>
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  {importType === 'initial' 
                    ? t('fileImport.modal.initialDescription')
                    : t('fileImport.modal.replaceDescription')
                  }
                </p>
                <p className="text-sm text-amber-600">
                  {importType === 'replace' && t('fileImport.modal.replaceWarning')}
                </p>
              </div>

              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : file 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB • {t('fileImport.upload.ready')}
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('fileImport.upload.removeFile')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <p className="text-gray-600">{t('fileImport.upload.dragAndDrop')}</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {t('fileImport.upload.browseToSelect')}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t('fileImport.upload.supportedFormats')}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={isUploading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || isUploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? t('fileImport.buttons.processing') : t('fileImport.buttons.startImport')}
                </button>
              </div>
            </>
          ) : (
            /* Import Progress/Results */
            <div className="space-y-6">
              <div className="text-center">
                {importResult.status === 'processing' ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{t('fileImport.progress.processingTitle')}</h3>
                      <p className="text-gray-600 mt-2">{importResult.message}</p>
                    </div>
                  </div>
                ) : importResult.status === 'completed' ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto">
                      <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{t('fileImport.progress.completedTitle')}</h3>
                      <p className="text-gray-600 mt-2">{importResult.message}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto">
                      <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{t('fileImport.progress.failedTitle')}</h3>
                      <p className="text-gray-600 mt-2">{importResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Details */}
              {importResult.detectedColumns && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{t('fileImport.details.title')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">{t('fileImport.details.rowsDetected')}:</span>
                      <span className="ml-2 font-medium">{importResult.rowCount}</span>
                    </div>
                    {importResult.estimatedTime && (
                      <div>
                        <span className="text-gray-500">{t('fileImport.details.estimatedTime')}:</span>
                        <span className="ml-2 font-medium">{importResult.estimatedTime}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-500">{t('fileImport.details.detectedColumns')}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {importResult.detectedColumns.map((column, index) => (
                        <span 
                          key={index}
                          className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {column}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Close button for completed/error states */}
              {importResult.status !== 'processing' && (
                <div className="flex justify-center">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    {t('common.close')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}