import { useState, useEffect } from 'react';
import { Transfer, Driver, Vehicle, COLLECTIONS } from '../models';
import firebaseService from '../services/firebaseService';
import TransferList from '../components/TransferList';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    vehicleId: '',
    driverId: '',
    source: '',
    dateFrom: '',
    dateTo: ''
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // Filtrar transferencias cuando cambien los filtros
  useEffect(() => {
    filterTransfers();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transfersData, driversData, vehiclesData] = await Promise.all([
        firebaseService.getAll(COLLECTIONS.TRANSFERS),
        firebaseService.getAll(COLLECTIONS.DRIVERS),
        firebaseService.getAll(COLLECTIONS.VEHICLES)
      ]);
      
      const transfersWithModels = transfersData.map(data => new Transfer(data));
      setTransfers(transfersWithModels);
      setDrivers(driversData.map(data => new Driver(data)));
      setVehicles(vehiclesData.map(data => new Vehicle(data)));
      setError('');
    } catch (err) {
      setError('Error cargando datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterTransfers = () => {
    // Esta función se puede expandir para filtrar en el frontend
    // Por ahora, mostramos todas las transferencias
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      vehicleId: '',
      driverId: '',
      source: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getFilteredTransfers = () => {
    return transfers.filter(transfer => {
      // Filtro por vehículo
      if (filters.vehicleId && transfer.vehicleId !== filters.vehicleId) {
        return false;
      }

      // Filtro por conductor (origen o destino)
      if (filters.driverId && 
          transfer.fromDriverId !== filters.driverId && 
          transfer.toDriverId !== filters.driverId) {
        return false;
      }

      // Filtro por fuente
      if (filters.source && transfer.source !== filters.source) {
        return false;
      }

      // Filtro por fecha desde
      if (filters.dateFrom) {
        const transferDate = new Date(transfer.transferDate);
        const fromDate = new Date(filters.dateFrom);
        if (transferDate < fromDate) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (filters.dateTo) {
        const transferDate = new Date(transfer.transferDate);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Incluir todo el día
        if (transferDate > toDate) {
          return false;
        }
      }

      return true;
    });
  };

  const getDriverById = (driverId) => {
    return drivers.find(d => d.id === driverId);
  };

  const getVehicleById = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const clearMessages = () => {
    setError('');
  };

  const filteredTransfers = getFilteredTransfers();
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div>
      <div className="mb-lg">
        <h1>Historial de Transferencias</h1>
        <p className="text-gray">
          Registro completo de todas las transferencias de vehículos entre conductores.
        </p>
      </div>

      {/* Mensajes de error */}
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

      {/* Filtros */}
      <div className="card mb-lg">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="mb-0">Filtros</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-sm btn-secondary"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-md">
            <div className="form-group">
              <label className="form-label">Vehículo</label>
              <select
                value={filters.vehicleId}
                onChange={(e) => handleFilterChange('vehicleId', e.target.value)}
                className="form-select"
              >
                <option value="">Todos los vehículos</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Conductor</label>
              <select
                value={filters.driverId}
                onChange={(e) => handleFilterChange('driverId', e.target.value)}
                className="form-select"
              >
                <option value="">Todos los conductores</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.license})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fuente</label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="form-select"
              >
                <option value="">Todas las fuentes</option>
                <option value="manual">Manual</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Período</label>
              <div className="flex gap-sm">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="form-input"
                  placeholder="Desde"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="form-input"
                  placeholder="Hasta"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-4 gap-md mb-lg">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold">{transfers.length}</div>
            <div className="text-sm text-gray">Total Transferencias</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold">
              {transfers.filter(t => t.source === 'whatsapp').length}
            </div>
            <div className="text-sm text-gray">Desde WhatsApp</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold">
              {transfers.filter(t => t.source === 'manual').length}
            </div>
            <div className="text-sm text-gray">Manuales</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold">{filteredTransfers.length}</div>
            <div className="text-sm text-gray">Filtradas</div>
          </div>
        </div>
      </div>

      {/* Lista de transferencias */}
      {loading ? (
        <div className="text-center py-lg">
          <div className="loading"></div>
          <p className="mt-md text-gray">Cargando transferencias...</p>
        </div>
      ) : (
        <TransferList 
          transfers={filteredTransfers}
          getDriverById={getDriverById}
          getVehicleById={getVehicleById}
        />
      )}
    </div>
  );
};

export default Transfers;