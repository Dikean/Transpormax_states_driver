import { useState } from 'react';

const TransferPreview = ({ 
  transfers, 
  drivers, 
  vehicles, 
  onSave, 
  onUpdateTransfer, 
  loading 
}) => {
  const [selectedTransfers, setSelectedTransfers] = useState(
    transfers.filter(t => t.isValid).map((_, index) => index)
  );

  const handleTransferToggle = (index) => {
    setSelectedTransfers(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    const validIndexes = transfers
      .map((transfer, index) => ({ transfer, index }))
      .filter(({ transfer }) => transfer.isValid)
      .map(({ index }) => index);
    
    setSelectedTransfers(validIndexes);
  };

  const handleDeselectAll = () => {
    setSelectedTransfers([]);
  };

  const handleManualMatch = (transferIndex, type, selectedId) => {
    const transfer = transfers[transferIndex];
    let updatedTransfer = { ...transfer };

    if (type === 'vehicle') {
      const vehicle = vehicles.find(v => v.id === selectedId);
      updatedTransfer.vehicleMatch = vehicle;
    } else if (type === 'fromDriver') {
      const driver = drivers.find(d => d.id === selectedId);
      updatedTransfer.fromDriverMatch = driver;
    } else if (type === 'toDriver') {
      const driver = drivers.find(d => d.id === selectedId);
      updatedTransfer.toDriverMatch = driver;
    }

    // Recalcular validez
    updatedTransfer.isValid = !!(updatedTransfer.vehicleMatch && updatedTransfer.toDriverMatch);

    onUpdateTransfer(transferIndex, updatedTransfer);
  };

  const handleSave = () => {
    const transfersToSave = selectedTransfers
      .map(index => transfers[index])
      .filter(transfer => transfer.isValid);
    
    onSave(transfersToSave);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-error';
  };

  const formatDate = (date) => {
    if (!date) return 'Fecha no detectada';
    return new Date(date).toLocaleString();
  };

  const validTransfersCount = transfers.filter(t => t.isValid).length;
  const selectedValidCount = selectedTransfers.filter(index => transfers[index].isValid).length;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-0">Transferencias Detectadas</h3>
            <p className="text-sm text-gray mt-xs">
              {validTransfersCount} de {transfers.length} transferencias son válidas
            </p>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={handleSelectAll}
              className="btn btn-sm btn-secondary"
              disabled={validTransfersCount === 0}
            >
              Seleccionar Válidas ({validTransfersCount})
            </button>
            <button
              onClick={handleDeselectAll}
              className="btn btn-sm btn-secondary"
            >
              Deseleccionar Todo
            </button>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        <div className="max-h-96 overflow-y-auto">
          {transfers.map((transfer, index) => (
            <div
              key={index}
              className={`
                border-b border-border p-md
                ${transfer.isValid ? 'bg-white' : 'bg-light'}
                ${selectedTransfers.includes(index) ? 'border-l-4 border-l-primary' : ''}
              `}
            >
              <div className="flex items-start gap-md">
                {/* Checkbox de selección */}
                <div className="flex items-center pt-xs">
                  <input
                    type="checkbox"
                    checked={selectedTransfers.includes(index)}
                    onChange={() => handleTransferToggle(index)}
                    disabled={!transfer.isValid}
                    className="form-checkbox"
                  />
                </div>

                {/* Contenido de la transferencia */}
                <div className="flex-1">
                  {/* Header con confianza y fecha */}
                  <div className="flex items-center justify-between mb-sm">
                    <div className="flex items-center gap-md">
                      <span className={`text-sm font-medium ${getConfidenceColor(transfer.confidence)}`}>
                        Confianza: {Math.round(transfer.confidence * 100)}%
                      </span>
                      {transfer.isValid ? (
                        <span className="status-badge status-active">Válida</span>
                      ) : (
                        <span className="status-badge status-inactive">Requiere Revisión</span>
                      )}
                    </div>
                    <span className="text-xs text-gray">
                      {formatDate(transfer.dateTime)}
                    </span>
                  </div>

                  {/* Texto original */}
                  <div className="mb-md">
                    <p className="text-sm bg-hover p-sm rounded border-l-4 border-l-border">
                      "{transfer.originalText}"
                    </p>
                  </div>

                  {/* Matches y sugerencias */}
                  <div className="grid grid-cols-3 gap-md">
                    {/* Vehículo */}
                    <div>
                      <label className="text-xs font-medium text-gray">Vehículo</label>
                      <div className="mt-xs">
                        {transfer.vehicleMatch ? (
                          <div className="text-sm">
                            <div className="font-medium">{transfer.vehicleMatch.plate}</div>
                            <div className="text-xs text-gray">
                              {transfer.vehicleMatch.brand} {transfer.vehicleMatch.model}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-error mb-xs">
                              "{transfer.vehicleId}" no encontrado
                            </div>
                            {transfer.suggestions.vehicle?.length > 0 && (
                              <select
                                className="form-select text-xs"
                                value=""
                                onChange={(e) => handleManualMatch(index, 'vehicle', e.target.value)}
                              >
                                <option value="">Seleccionar similar...</option>
                                {transfer.suggestions.vehicle.map(vehicle => (
                                  <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.plate} - {vehicle.brand} {vehicle.model}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conductor origen */}
                    <div>
                      <label className="text-xs font-medium text-gray">De</label>
                      <div className="mt-xs">
                        {transfer.fromDriverMatch ? (
                          <div className="text-sm">
                            <div className="font-medium">{transfer.fromDriverMatch.name}</div>
                            <div className="text-xs text-gray">{transfer.fromDriverMatch.license}</div>
                          </div>
                        ) : transfer.fromDriver ? (
                          <div>
                            <div className="text-sm text-warning mb-xs">
                              "{transfer.fromDriver}" no encontrado
                            </div>
                            {transfer.suggestions.fromDriver?.length > 0 && (
                              <select
                                className="form-select text-xs"
                                value=""
                                onChange={(e) => handleManualMatch(index, 'fromDriver', e.target.value)}
                              >
                                <option value="">Seleccionar similar...</option>
                                {transfer.suggestions.fromDriver.map(driver => (
                                  <option key={driver.id} value={driver.id}>
                                    {driver.name} ({driver.license})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray">No especificado</span>
                        )}
                      </div>
                    </div>

                    {/* Conductor destino */}
                    <div>
                      <label className="text-xs font-medium text-gray">Para</label>
                      <div className="mt-xs">
                        {transfer.toDriverMatch ? (
                          <div className="text-sm">
                            <div className="font-medium">{transfer.toDriverMatch.name}</div>
                            <div className="text-xs text-gray">{transfer.toDriverMatch.license}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-error mb-xs">
                              "{transfer.toDriver}" no encontrado
                            </div>
                            {transfer.suggestions.toDriver?.length > 0 && (
                              <select
                                className="form-select text-xs"
                                value=""
                                onChange={(e) => handleManualMatch(index, 'toDriver', e.target.value)}
                              >
                                <option value="">Seleccionar similar...</option>
                                {transfer.suggestions.toDriver.map(driver => (
                                  <option key={driver.id} value={driver.id}>
                                    {driver.name} ({driver.license})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-footer">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray">
            {selectedValidCount} transferencias seleccionadas para guardar
          </div>
          <button
            onClick={handleSave}
            disabled={selectedValidCount === 0 || loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="loading mr-sm"></div>
                Guardando...
              </>
            ) : (
              `Guardar ${selectedValidCount} Transferencias`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferPreview;