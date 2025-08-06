import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Driver, Vehicle, Transfer, DRIVER_STATES, VEHICLE_STATES, COLLECTIONS } from '../models';
import firebaseService from '../services/firebaseService';

const Dashboard = () => {
  const [data, setData] = useState({
    drivers: [],
    vehicles: [],
    transfers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [driversData, vehiclesData, transfersData] = await Promise.all([
        firebaseService.getAll(COLLECTIONS.DRIVERS),
        firebaseService.getAll(COLLECTIONS.VEHICLES),
        firebaseService.getAll(COLLECTIONS.TRANSFERS)
      ]);
      
      setData({
        drivers: driversData.map(data => new Driver(data)),
        vehicles: vehiclesData.map(data => new Vehicle(data)),
        transfers: transfersData.map(data => new Transfer(data))
      });
      setError('');
    } catch (err) {
      setError('Error cargando datos del dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const { drivers, vehicles, transfers } = data;

    // Estadísticas de conductores
    const activeDrivers = drivers.filter(d => d.state === DRIVER_STATES.ACTIVE).length;
    const inactiveDrivers = drivers.filter(d => d.state === DRIVER_STATES.INACTIVE).length;

    // Estadísticas de vehículos
    const activeVehicles = vehicles.filter(v => v.state === VEHICLE_STATES.ACTIVE).length;
    const inactiveVehicles = vehicles.filter(v => v.state === VEHICLE_STATES.INACTIVE).length;
    const maintenanceVehicles = vehicles.filter(v => v.state === VEHICLE_STATES.MAINTENANCE).length;
    const assignedVehicles = vehicles.filter(v => v.currentDriverId).length;
    const unassignedVehicles = vehicles.length - assignedVehicles;

    // Estadísticas de transferencias
    const recentTransfers = transfers.filter(t => {
      const transferDate = new Date(t.transferDate || t.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return transferDate >= sevenDaysAgo;
    }).length;

    const whatsappTransfers = transfers.filter(t => t.source === 'whatsapp').length;
    const manualTransfers = transfers.filter(t => t.source === 'manual').length;

    return {
      drivers: {
        total: drivers.length,
        active: activeDrivers,
        inactive: inactiveDrivers
      },
      vehicles: {
        total: vehicles.length,
        active: activeVehicles,
        inactive: inactiveVehicles,
        maintenance: maintenanceVehicles,
        assigned: assignedVehicles,
        unassigned: unassignedVehicles
      },
      transfers: {
        total: transfers.length,
        recent: recentTransfers,
        whatsapp: whatsappTransfers,
        manual: manualTransfers
      }
    };
  };

  const getRecentTransfers = () => {
    return data.transfers
      .sort((a, b) => {
        const dateA = new Date(a.transferDate || a.createdAt);
        const dateB = new Date(b.transferDate || b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 5);
  };

  const getVehicleAssignments = () => {
    return data.vehicles
      .filter(v => v.currentDriverId)
      .map(vehicle => {
        const driver = data.drivers.find(d => d.id === vehicle.currentDriverId);
        return { vehicle, driver };
      })
      .slice(0, 10);
  };

  const formatDate = (date) => {
    if (!date) return 'Fecha no disponible';
    try {
      return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-lg">
        <div className="loading"></div>
        <p className="mt-md text-gray">Cargando dashboard...</p>
      </div>
    );
  }

  const stats = getStats();
  const recentTransfers = getRecentTransfers();
  const vehicleAssignments = getVehicleAssignments();

  return (
    <div>
      <div className="mb-lg">
        <h1>Dashboard</h1>
        <p className="text-gray">
          Resumen general del sistema de gestión de conductores y vehículos.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-lg">
          {error}
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-4 gap-md mb-lg">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-primary mb-sm">{stats.drivers.total}</div>
            <div className="text-sm font-medium mb-xs">Conductores</div>
            <div className="text-xs text-gray">
              {stats.drivers.active} activos • {stats.drivers.inactive} inactivos
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-primary mb-sm">{stats.vehicles.total}</div>
            <div className="text-sm font-medium mb-xs">Vehículos</div>
            <div className="text-xs text-gray">
              {stats.vehicles.active} activos • {stats.vehicles.maintenance} mantenimiento
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-primary mb-sm">{stats.vehicles.assigned}</div>
            <div className="text-sm font-medium mb-xs">Asignados</div>
            <div className="text-xs text-gray">
              {stats.vehicles.unassigned} sin asignar
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-primary mb-sm">{stats.transfers.total}</div>
            <div className="text-sm font-medium mb-xs">Transferencias</div>
            <div className="text-xs text-gray">
              {stats.transfers.recent} esta semana
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de estado */}
      <div className="grid grid-cols-2 gap-lg mb-lg">
        <div className="card">
          <div className="card-header">
            <h3 className="mb-0">Estado de Vehículos</h3>
          </div>
          <div className="card-body">
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-4 h-4 bg-success rounded"></div>
                  <span className="text-sm">Activos</span>
                </div>
                <span className="font-medium">{stats.vehicles.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-4 h-4 bg-warning rounded"></div>
                  <span className="text-sm">Mantenimiento</span>
                </div>
                <span className="font-medium">{stats.vehicles.maintenance}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-4 h-4 bg-tertiary rounded"></div>
                  <span className="text-sm">Inactivos</span>
                </div>
                <span className="font-medium">{stats.vehicles.inactive}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="mb-0">Fuente de Transferencias</h3>
          </div>
          <div className="card-body">
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-4 h-4 bg-success rounded"></div>
                  <span className="text-sm">WhatsApp</span>
                </div>
                <span className="font-medium">{stats.transfers.whatsapp}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-4 h-4 bg-tertiary rounded"></div>
                  <span className="text-sm">Manual</span>
                </div>
                <span className="font-medium">{stats.transfers.manual}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-4 gap-md mb-lg">
        <Link to="/drivers" className="card hover:shadow-md transition-shadow">
          <div className="card-body text-center">
            <div className="text-4xl mb-sm">👤</div>
            <div className="text-sm font-medium">Gestionar Conductores</div>
          </div>
        </Link>

        <Link to="/vehicles" className="card hover:shadow-md transition-shadow">
          <div className="card-body text-center">
            <div className="text-4xl mb-sm">🚗</div>
            <div className="text-sm font-medium">Gestionar Vehículos</div>
          </div>
        </Link>

        <Link to="/upload" className="card hover:shadow-md transition-shadow">
          <div className="card-body text-center">
            <div className="text-4xl mb-sm">📱</div>
            <div className="text-sm font-medium">Procesar Chat</div>
          </div>
        </Link>

        <Link to="/transfers" className="card hover:shadow-md transition-shadow">
          <div className="card-body text-center">
            <div className="text-4xl mb-sm">📋</div>
            <div className="text-sm font-medium">Ver Transferencias</div>
          </div>
        </Link>
      </div>

      {/* Información reciente */}
      <div className="grid grid-cols-2 gap-lg">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="mb-0">Transferencias Recientes</h3>
              <Link to="/transfers" className="text-sm text-primary hover:underline">
                Ver todas
              </Link>
            </div>
          </div>
          <div className="card-body">
            {recentTransfers.length > 0 ? (
              <div className="space-y-md">
                {recentTransfers.map(transfer => {
                  const vehicle = data.vehicles.find(v => v.id === transfer.vehicleId);
                  const toDriver = data.drivers.find(d => d.id === transfer.toDriverId);
                  
                  return (
                    <div key={transfer.id} className="flex items-center justify-between py-sm border-b border-border last:border-b-0">
                      <div>
                        <div className="text-sm font-medium">
                          {vehicle?.plate || 'Vehículo desconocido'} → {toDriver?.name || 'Conductor desconocido'}
                        </div>
                        <div className="text-xs text-gray">
                          {formatDate(transfer.transferDate)}
                        </div>
                      </div>
                      <span className={`status-badge ${transfer.source === 'whatsapp' ? 'status-active' : 'status-inactive'}`}>
                        {transfer.source === 'whatsapp' ? 'WhatsApp' : 'Manual'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray text-center">No hay transferencias recientes</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="mb-0">Asignaciones Actuales</h3>
              <Link to="/vehicles" className="text-sm text-primary hover:underline">
                Gestionar
              </Link>
            </div>
          </div>
          <div className="card-body">
            {vehicleAssignments.length > 0 ? (
              <div className="space-y-md">
                {vehicleAssignments.map(({ vehicle, driver }) => (
                  <div key={vehicle.id} className="flex items-center justify-between py-sm border-b border-border last:border-b-0">
                    <div>
                      <div className="text-sm font-medium">{vehicle.plate}</div>
                      <div className="text-xs text-gray">
                        {vehicle.brand} {vehicle.model}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{driver?.name || 'Sin conductor'}</div>
                      <div className="text-xs text-gray">{driver?.license || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray text-center">No hay vehículos asignados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;