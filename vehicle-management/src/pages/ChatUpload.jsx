import { useState, useEffect } from 'react';
import { Transfer, Driver, Vehicle, COLLECTIONS } from '../models';
import firebaseService from '../services/firebaseService';
import whatsappParser from '../utils/whatsappParser';
import FileUpload from '../components/FileUpload';
import TransferPreview from '../components/TransferPreview';

const ChatUpload = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [parsedTransfers, setParsedTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingFile, setProcessingFile] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [driversData, vehiclesData] = await Promise.all([
        firebaseService.getAll(COLLECTIONS.DRIVERS),
        firebaseService.getAll(COLLECTIONS.VEHICLES)
      ]);
      
      setDrivers(driversData.map(data => new Driver(data)));
      setVehicles(vehiclesData.map(data => new Vehicle(data)));
      setError('');
    } catch (err) {
      setError('Error cargando datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setProcessingFile(true);
    setError('');
    setParsedTransfers([]);

    try {
      const fileContent = await readFileContent(file);
      const fileType = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'txt';
      
      // Parsear el archivo
      const transfers = fileType === 'csv' 
        ? whatsappParser.parseCSV(fileContent)
        : whatsappParser.parseChat(fileContent, fileType);

      if (transfers.length === 0) {
        setError('No se encontraron transferencias en el archivo. Verifica que el formato sea correcto.');
        return;
      }

      // Enriquecer transferencias con datos de la base de datos
      const enrichedTransfers = enrichTransfers(transfers);
      setParsedTransfers(enrichedTransfers);
      setSuccess(`Se encontraron ${transfers.length} transferencias potenciales`);

    } catch (err) {
      setError('Error procesando archivo: ' + err.message);
    } finally {
      setProcessingFile(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const enrichTransfers = (transfers) => {
    return transfers.map(transfer => {
      // Buscar vehículo por placa o identificador
      const vehicle = findVehicleByIdentifier(transfer.vehicleId);
      
      // Buscar conductores por nombre
      const fromDriver = transfer.fromDriver ? findDriverByName(transfer.fromDriver) : null;
      const toDriver = findDriverByName(transfer.toDriver);

      return {
        ...transfer,
        vehicleMatch: vehicle,
        fromDriverMatch: fromDriver,
        toDriverMatch: toDriver,
        isValid: !!(vehicle && toDriver),
        suggestions: {
          vehicle: vehicle ? null : getSimilarVehicles(transfer.vehicleId),
          fromDriver: fromDriver ? null : getSimilarDrivers(transfer.fromDriver),
          toDriver: toDriver ? null : getSimilarDrivers(transfer.toDriver)
        }
      };
    });
  };

  const findVehicleByIdentifier = (identifier) => {
    if (!identifier) return null;
    
    const cleanId = identifier.toLowerCase().replace(/\s+/g, '');
    return vehicles.find(vehicle => 
      vehicle.plate.toLowerCase().replace(/\s+/g, '') === cleanId ||
      vehicle.plate.toLowerCase().replace(/[-\s]/g, '') === cleanId.replace(/[-]/g, '')
    );
  };

  const findDriverByName = (name) => {
    if (!name) return null;
    
    const cleanName = name.toLowerCase().trim();
    return drivers.find(driver => 
      driver.name.toLowerCase().includes(cleanName) ||
      cleanName.includes(driver.name.toLowerCase().split(' ')[0]) // Buscar por primer nombre
    );
  };

  const getSimilarVehicles = (identifier) => {
    if (!identifier) return [];
    
    const cleanId = identifier.toLowerCase();
    return vehicles.filter(vehicle => 
      vehicle.plate.toLowerCase().includes(cleanId.substring(0, 3)) ||
      cleanId.includes(vehicle.plate.toLowerCase().substring(0, 3))
    ).slice(0, 3);
  };

  const getSimilarDrivers = (name) => {
    if (!name) return [];
    
    const cleanName = name.toLowerCase();
    return drivers.filter(driver => {
      const driverName = driver.name.toLowerCase();
      return driverName.includes(cleanName.split(' ')[0]) ||
             cleanName.includes(driverName.split(' ')[0]);
    }).slice(0, 3);
  };

  const handleSaveTransfers = async (transfersToSave) => {
    if (transfersToSave.length === 0) {
      setError('No hay transferencias válidas para guardar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const savedTransfers = [];
      const vehicleUpdates = [];

      for (const transferData of transfersToSave) {
        // Crear transferencia
        const transfer = new Transfer({
          vehicleId: transferData.vehicleMatch.id,
          fromDriverId: transferData.fromDriverMatch?.id || null,
          toDriverId: transferData.toDriverMatch.id,
          transferDate: transferData.dateTime || new Date(),
          reason: 'Transferencia desde WhatsApp',
          extractedText: transferData.originalText,
          source: 'whatsapp'
        });

        const transferId = await firebaseService.create(COLLECTIONS.TRANSFERS, transfer.toFirestore());
        savedTransfers.push({ ...transfer.toFirestore(), id: transferId });

        // Actualizar vehículo con nuevo conductor
        vehicleUpdates.push({
          vehicleId: transferData.vehicleMatch.id,
          newDriverId: transferData.toDriverMatch.id
        });
      }

      // Actualizar vehículos
      await Promise.all(
        vehicleUpdates.map(update => 
          firebaseService.update(COLLECTIONS.VEHICLES, update.vehicleId, {
            currentDriverId: update.newDriverId
          })
        )
      );

      setSuccess(`Se guardaron ${savedTransfers.length} transferencias exitosamente`);
      setParsedTransfers([]);

    } catch (err) {
      setError('Error guardando transferencias: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div>
      <div className="mb-lg">
        <h1>Procesar Chat de WhatsApp</h1>
        <p className="text-gray">
          Sube un archivo de chat de WhatsApp (.txt o .csv) para extraer automáticamente 
          las transferencias de vehículos entre conductores.
        </p>
      </div>

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button 
            className="btn btn-sm btn-secondary ml-md"
            onClick={clearMessages}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button 
            className="btn btn-sm btn-secondary ml-md"
            onClick={clearMessages}
          >
            ×
          </button>
        </div>
      )}

      {/* Upload de archivo */}
      <div className="card mb-lg">
        <div className="card-header">
          <h3 className="mb-0">Subir Archivo de Chat</h3>
        </div>
        <div className="card-body">
          <FileUpload
            onFileSelect={handleFileUpload}
            loading={processingFile}
            acceptedTypes=".txt,.csv"
            maxSize={10} // 10MB
          />
          
          <div className="mt-md">
            <h4 className="text-sm font-semibold mb-sm">Formatos soportados:</h4>
            <ul className="text-sm text-gray">
              <li>• Archivos .txt exportados de WhatsApp</li>
              <li>• Archivos .csv con columnas: fecha, hora, remitente, mensaje</li>
              <li>• Máximo 10MB por archivo</li>
            </ul>
          </div>

          <div className="mt-md">
            <h4 className="text-sm font-semibold mb-sm">Patrones reconocidos:</h4>
            <ul className="text-sm text-gray">
              <li>• "le paso el carro ABC-123 a Juan"</li>
              <li>• "el carro XYZ-456 se lo paso a María"</li>
              <li>• "Pedro recibe el carro DEF-789"</li>
              <li>• "transferir carro GHI-012 a Luis"</li>
              <li>• "carro JKL-345 para Ana"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Vista previa de transferencias */}
      {parsedTransfers.length > 0 && (
        <TransferPreview
          transfers={parsedTransfers}
          drivers={drivers}
          vehicles={vehicles}
          onSave={handleSaveTransfers}
          onUpdateTransfer={(index, updatedTransfer) => {
            const updated = [...parsedTransfers];
            updated[index] = updatedTransfer;
            setParsedTransfers(updated);
          }}
          loading={loading}
        />
      )}

      {/* Información adicional */}
      {parsedTransfers.length === 0 && !processingFile && (
        <div className="card">
          <div className="card-body text-center">
            <p className="text-gray">No hay transferencias procesadas</p>
            <p className="text-sm text-gray">
              Sube un archivo de chat para comenzar el análisis
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatUpload;