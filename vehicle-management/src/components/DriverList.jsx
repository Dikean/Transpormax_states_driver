import { DRIVER_STATES } from '../models';

const DriverList = ({ drivers, onEdit, onDelete, onToggleStatus }) => {
  const getStatusClass = (state) => {
    switch (state) {
      case DRIVER_STATES.ACTIVE:
        return 'status-active';
      case DRIVER_STATES.INACTIVE:
        return 'status-inactive';
      default:
        return 'status-inactive';
    }
  };

  const getStatusText = (state) => {
    switch (state) {
      case DRIVER_STATES.ACTIVE:
        return 'Activo';
      case DRIVER_STATES.INACTIVE:
        return 'Inactivo';
      default:
        return 'Desconocido';
    }
  };

  if (drivers.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p className="text-gray">No hay conductores registrados</p>
          <p className="text-sm text-gray">Haz clic en "Nuevo Conductor" para agregar el primero</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="mb-0">Conductores ({drivers.length})</h3>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Licencia</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver.id}>
                  <td>
                    <div className="font-medium">{driver.name}</div>
                  </td>
                  <td>
                    <span className="text-sm font-medium">{driver.license}</span>
                  </td>
                  <td>
                    <span className="text-sm">
                      {driver.phone || <span className="text-gray">—</span>}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm">
                      {driver.email || <span className="text-gray">—</span>}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(driver.state)}`}>
                      {getStatusText(driver.state)}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-sm">
                      <button
                        onClick={() => onEdit(driver)}
                        className="btn btn-sm btn-secondary"
                        title="Editar conductor"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onToggleStatus(driver)}
                        className={`btn btn-sm ${
                          driver.state === DRIVER_STATES.ACTIVE 
                            ? 'btn-warning' 
                            : 'btn-success'
                        }`}
                        title={
                          driver.state === DRIVER_STATES.ACTIVE 
                            ? 'Desactivar conductor' 
                            : 'Activar conductor'
                        }
                      >
                        {driver.state === DRIVER_STATES.ACTIVE ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => onDelete(driver.id)}
                        className="btn btn-sm btn-error"
                        title="Eliminar conductor"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DriverList;