import { useState, useRef } from 'react';

const FileUpload = ({ onFileSelect, loading, acceptedTypes = '.txt,.csv', maxSize = 10 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validar tipo de archivo
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const acceptedTypesArray = acceptedTypes.split(',').map(type => type.trim());
    
    if (!acceptedTypesArray.includes(fileExtension)) {
      alert(`Tipo de archivo no soportado. Solo se permiten: ${acceptedTypes}`);
      return;
    }

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`El archivo es muy grande. Tamaño máximo: ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      {/* Área de drag and drop */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-lg text-center cursor-pointer transition-colors
          ${dragActive 
            ? 'border-primary bg-hover' 
            : 'border-border hover:border-secondary hover:bg-hover'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!loading ? handleButtonClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleInputChange}
          className="hidden"
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-md">
            <div className="loading"></div>
            <p className="text-gray">Procesando archivo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-md">
            <div className="text-4xl text-gray">📁</div>
            <div>
              <p className="font-medium">
                {dragActive 
                  ? 'Suelta el archivo aquí' 
                  : 'Arrastra un archivo aquí o haz clic para seleccionar'
                }
              </p>
              <p className="text-sm text-gray mt-sm">
                Formatos soportados: {acceptedTypes} • Máximo {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Información del archivo seleccionado */}
      {selectedFile && !loading && (
        <div className="mt-md p-md border border-border rounded-lg bg-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md">
              <div className="text-2xl">📄</div>
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Archivo de texto'}
                </p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="btn btn-sm btn-secondary"
              title="Eliminar archivo"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Botón de selección alternativo */}
      {!selectedFile && !loading && (
        <div className="mt-md text-center">
          <button
            onClick={handleButtonClick}
            className="btn btn-secondary"
          >
            Seleccionar Archivo
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;