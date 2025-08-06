import { VEHICLE_STATES, DRIVER_STATES } from '../models';

const VehicleList = ({ 
  vehicles, 
  drivers, 
  onEdit, 
  onDelete, 
  onChangeStatus, 
  onAssignDriver,
  getDriverById 
}) => {
  const getStatusClass = (state) => {
    switch (state) {
      case VEHICLE_STATES.ACTIVE:
        return 'status-active';
      case VEHICLE_STATES.INACTIVE:
        return 'status-inactive';
      case VEHICLE_STATES.MAINTENANCE:
        return 'status-maintenance';
      default:
        return 'status-inactive';
    }
  };

  const getStatusText = (state) => {
    switch (state) {
      case VEHICLE_STATES.ACTIVE:
        return 'Activo';
      case VEHICLE_STATES.INACTIVE:
        return 'Inactivo';
      case VEHICLE_STATES.MAINTENANCE:
        return 'Mantenimiento';
      default:
        return 'Desconocido';
    }
  };

  const handleDriverChange = (vehicleId, driverId) => {
    onAssignDriver(vehicleId, driverId || null);
  };

  const getActiveDrivers = () => {
    return drivers.filter(driver => driver.state === DRIVER_STATES.ACTIVE);
  };

  if (vehicles.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p className="text-gray">No hay vehículos registrados</p>
          <p className="text-sm text-gray">Haz clic en "Nuevo Vehículo" para agregar el primero</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="mb-0">Vehículos ({vehicles.length})</h3>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Vehículo</th>
                <th>Año</th>
                <th>Color</th>
                <th>Estado</th>
                <th>Conductor</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(vehicle => {
                const currentDriver = getDriverById(vehicle.currentDriverId);
                const activeDrivers = getActiveDrivers();

                return (
                  <tr key={vehicle.id}>
                    <td>
                      <div className="font-bold text-lg">{vehicle.plate}</div>
                    </td>
                    <td>
                      <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                    </td>
                    <td>
                      <span className="text-sm">{vehicle.year}</span>
                    </td>
                    <td>
                      <span className="text-sm">
                        {vehicle.color || <span className="text-gray">—</span>}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-xs">
                        <span className={`status-badge ${getStatusClass(vehicle.state)}`}>
                          {getStatusText(vehicle.state)}
                        </span>
                        <select
                          value={vehicle.state}
                          onChange={(e) => onChangeStatus(vehicle, e.target.value)}
                          className="form-select text-xs"
                          style={{ minWidth: '120px' }}
                        >
                          <option value={VEHICLE_STATES.ACTIVE}>Activo</option>
                          <option value={VEHICLE_STATES.INACTIVE}>Inactivo</option>
                          <option value={VEHICLE_STATES.MAINTENANCE}>Mantenimiento</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-xs">
                        {currentDriver ? (
                          <div className="text-sm font-medium">
                            {currentDriver.name}
                            <div className="text-xs text-gray">{currentDriver.license}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray">Sin asignar</span>
                        )}
                        <select
                          value={vehicle.currentDriverId || ''}
                          onChange={(e) => handleDriverChange(vehicle.id, e.target.value)}
                          className="form-select text-xs"
                          style={{ minWidth: '150px' }}
                        >
                          <option value="">Sin asignar</option>
                          {activeDrivers.map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} ({driver.license})
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-sm">
                        <button
                          onClick={() => onEdit(vehicle)}
                          className="btn btn-sm btn-secondary"
                          title="Editar vehículo"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDelete(vehicle.id)}
                          className="btn btn-sm btn-error"
                          title="Eliminar vehículo"
                        >
                          🗑️
                        </button>
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

export default VehicleList;