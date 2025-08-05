import { useState, useEffect } from 'react';
import { Vehicle, Driver, VEHICLE_STATES, COLLECTIONS } from '../models';
import firebaseService from '../services/firebaseService';
import VehicleForm from '../components/VehicleForm';
import VehicleList from '../components/VehicleList';
import Modal from '../components/Modal';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // Cargar vehículos y conductores al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, driversData] = await Promise.all([
        firebaseService.getAll(COLLECTIONS.VEHICLES),
        firebaseService.getAll(COLLECTIONS.DRIVERS)
      ]);
      
      setVehicles(vehiclesData.map(data => new Vehicle(data)));
      setDrivers(driversData.map(data => new Driver(data)));
      setError('');
    } catch (err) {
      setError('Error cargando datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = () => {
    setEditingVehicle(null);
    setShowModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowModal(true);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este vehículo?')) {
      return;
    }

    try {
      await firebaseService.delete(COLLECTIONS.VEHICLES, vehicleId);
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      setSuccess('Vehículo eliminado exitosamente');
    } catch (err) {
      setError('Error eliminando vehículo: ' + err.message);
    }
  };

  const handleSaveVehicle = async (vehicleData) => {
    try {
      const vehicle = new Vehicle(vehicleData);
      const validation = vehicle.validate();
      
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      if (editingVehicle) {
        // Actualizar vehículo existente
        await firebaseService.update(COLLECTIONS.VEHICLES, editingVehicle.id, vehicle.toFirestore());
        setVehicles(vehicles.map(v => 
          v.id === editingVehicle.id ? new Vehicle({ ...vehicle.toFirestore(), id: editingVehicle.id }) : v
        ));
        setSuccess('Vehículo actualizado exitosamente');
      } else {
        // Crear nuevo vehículo
        const newId = await firebaseService.create(COLLECTIONS.VEHICLES, vehicle.toFirestore());
        setVehicles([...vehicles, new Vehicle({ ...vehicle.toFirestore(), id: newId })]);
        setSuccess('Vehículo creado exitosamente');
      }

      setShowModal(false);
      setError('');
    } catch (err) {
      setError('Error guardando vehículo: ' + err.message);
    }
  };

  const handleChangeStatus = async (vehicle, newStatus) => {
    try {
      await firebaseService.update(COLLECTIONS.VEHICLES, vehicle.id, { state: newStatus });
      
      setVehicles(vehicles.map(v => 
        v.id === vehicle.id ? new Vehicle({ ...v, state: newStatus }) : v
      ));
      
      setSuccess(`Vehículo marcado como ${newStatus} exitosamente`);
    } catch (err) {
      setError('Error cambiando estado del vehículo: ' + err.message);
    }
  };

  const handleAssignDriver = async (vehicleId, driverId) => {
    try {
      // Si se asigna a un conductor, remover el vehículo de otros conductores
      if (driverId) {
        const otherVehicles = vehicles.filter(v => v.currentDriverId === driverId && v.id !== vehicleId);
        await Promise.all(
          otherVehicles.map(v => 
            firebaseService.update(COLLECTIONS.VEHICLES, v.id, { currentDriverId: null })
          )
        );
      }

      await firebaseService.update(COLLECTIONS.VEHICLES, vehicleId, { currentDriverId: driverId });
      
      setVehicles(vehicles.map(v => {
        if (v.id === vehicleId) {
          return new Vehicle({ ...v, currentDriverId: driverId });
        }
        if (driverId && v.currentDriverId === driverId) {
          return new Vehicle({ ...v, currentDriverId: null });
        }
        return v;
      }));
      
      const driver = drivers.find(d => d.id === driverId);
      setSuccess(
        driverId 
          ? `Vehículo asignado a ${driver?.name} exitosamente`
          : 'Vehículo desasignado exitosamente'
      );
    } catch (err) {
      setError('Error asignando conductor: ' + err.message);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Obtener conductor por ID
  const getDriverById = (driverId) => {
    return drivers.find(d => d.id === driverId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <h1>Gestión de Vehículos</h1>
        <button 
          className="btn btn-primary"
          onClick={handleCreateVehicle}
        >
          Nuevo Vehículo
        </button>
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

      {/* Lista de vehículos */}
      {loading ? (
        <div className="text-center py-lg">
          <div className="loading"></div>
          <p className="mt-md text-gray">Cargando vehículos...</p>
        </div>
      ) : (
        <VehicleList 
          vehicles={vehicles}
          drivers={drivers}
          onEdit={handleEditVehicle}
          onDelete={handleDeleteVehicle}
          onChangeStatus={handleChangeStatus}
          onAssignDriver={handleAssignDriver}
          getDriverById={getDriverById}
        />
      )}

      {/* Modal para crear/editar vehículo */}
      {showModal && (
        <Modal
          title={editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          onClose={() => setShowModal(false)}
        >
          <VehicleForm
            vehicle={editingVehicle}
            drivers={drivers}
            onSave={handleSaveVehicle}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Vehicles;