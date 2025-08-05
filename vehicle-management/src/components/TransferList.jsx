import { DEPARTMENT_INFO } from '../constants/index.js';

const TransferList = ({ transfers, getDriverById, getVehicleById }) => {
  const formatDate = (date) => {
    if (!date) return 'Fecha no disponible';
    try {
      return new Date(date).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getSourceBadge = (source) => {
    switch (source) {
      case 'whatsapp':
        return <span className="status-badge status-active">WhatsApp</span>;
      case 'manual':
        return <span className="status-badge status-inactive">Manual</span>;
      default:
        return <span className="status-badge status-inactive">Desconocido</span>;
    }
  };

  const getDepartmentBadge = (department) => {
    if (!department) {
      return <span className="status-badge status-inactive">Sin departamento</span>;
    }
    
    const deptInfo = DEPARTMENT_INFO[department];
    if (!deptInfo) {
      return <span className="status-badge status-inactive">{department}</span>;
    }
    
    return (
      <span 
        className="status-badge" 
        style={{ 
          backgroundColor: `${deptInfo.color}20`,
          color: deptInfo.color,
          border: `1px solid ${deptInfo.color}40`
        }}
      >
        {deptInfo.icon} {deptInfo.name}
      </span>
    );
  };

  if (transfers.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p className="text-gray">No hay transferencias que mostrar</p>
          <p className="text-sm text-gray">
            Las transferencias aparecerán aquí cuando se registren
          </p>
        </div>
      </div>
    );
  }

  // Ordenar transferencias por fecha (más recientes primero)
  const sortedTransfers = [...transfers].sort((a, b) => {
    const dateA = new Date(a.transferDate || a.createdAt);
    const dateB = new Date(b.transferDate || b.createdAt);
    return dateB - dateA;
  });

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="mb-0">Transferencias ({transfers.length})</h3>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Vehículo</th>
                <th>De</th>
                <th>Para</th>
                <th>Fuente</th>
                <th>Departamento</th>
                <th className="mobile-hidden">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransfers.map(transfer => {
                const vehicle = getVehicleById(transfer.vehicleId);
                const fromDriver = getDriverById(transfer.fromDriverId);
                const toDriver = getDriverById(transfer.toDriverId);

                return (
                  <tr key={transfer.id}>
                    <td>
                      <div className="text-sm">
                        {formatDate(transfer.transferDate)}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <div className="font-bold">
                          {vehicle ? vehicle.plate : 'Vehículo no encontrado'}
                        </div>
                        {vehicle && (
                          <div className="text-xs text-gray">
                            {vehicle.brand} {vehicle.model} {vehicle.year}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {fromDriver ? (
                          <div>
                            <div className="font-medium">{fromDriver.name}</div>
                            <div className="text-xs text-gray">{fromDriver.license}</div>
                          </div>
                        ) : (
                          <span className="text-gray">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {toDriver ? (
                          <div>
                            <div className="font-medium">{toDriver.name}</div>
                            <div className="text-xs text-gray">{toDriver.license}</div>
                          </div>
                        ) : (
                          <span className="text-error">Conductor no encontrado</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {getSourceBadge(transfer.source)}
                    </td>
                    <td>
                      {getDepartmentBadge(transfer.department)}
                    </td>
                    <td className="mobile-hidden">
                      <div className="text-sm">
                        {transfer.reason && (
                          <div className="mb-xs">
                            <strong>Motivo:</strong> {transfer.reason}
                          </div>
                        )}
                        {transfer.extractedText && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray hover:text-primary">
                              Ver texto original
                            </summary>
                            <div className="mt-xs p-xs bg-light rounded border-l-2 border-l-border">
                              "{transfer.extractedText}"
                            </div>
                          </details>
                        )}
                        {!transfer.reason && !transfer.extractedText && (
                          <span className="text-gray">Sin detalles</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransferList;