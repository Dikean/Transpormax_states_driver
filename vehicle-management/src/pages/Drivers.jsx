import { useState, useEffect } from 'react';
import { Driver, DRIVER_STATES, COLLECTIONS } from '../models';
import firebaseService from '../services/firebaseService';
import DriverForm from '../components/DriverForm';
import DriverList from '../components/DriverList';
import Modal from '../components/Modal';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  // Cargar conductores al montar el componente
  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const driversData = await firebaseService.getAll(COLLECTIONS.DRIVERS);
      setDrivers(driversData.map(data => new Driver(data)));
      setError('');
    } catch (err) {
      setError('Error cargando conductores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = () => {
    setEditingDriver(null);
    setShowModal(true);
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    setShowModal(true);
  };

  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este conductor?')) {
      return;
    }

    try {
      await firebaseService.delete(COLLECTIONS.DRIVERS, driverId);
      setDrivers(drivers.filter(d => d.id !== driverId));
      setSuccess('Conductor eliminado exitosamente');
    } catch (err) {
      setError('Error eliminando conductor: ' + err.message);
    }
  };

  const handleSaveDriver = async (driverData) => {
    try {
      const driver = new Driver(driverData);
      const validation = driver.validate();
      
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      if (editingDriver) {
        // Actualizar conductor existente
        await firebaseService.update(COLLECTIONS.DRIVERS, editingDriver.id, driver.toFirestore());
        setDrivers(drivers.map(d => 
          d.id === editingDriver.id ? new Driver({ ...driver.toFirestore(), id: editingDriver.id }) : d
        ));
        setSuccess('Conductor actualizado exitosamente');
      } else {
        // Crear nuevo conductor
        const newId = await firebaseService.create(COLLECTIONS.DRIVERS, driver.toFirestore());
        setDrivers([...drivers, new Driver({ ...driver.toFirestore(), id: newId })]);
        setSuccess('Conductor creado exitosamente');
      }

      setShowModal(false);
      setError('');
    } catch (err) {
      setError('Error guardando conductor: ' + err.message);
    }
  };

  const handleToggleStatus = async (driver) => {
    try {
      const newState = driver.state === DRIVER_STATES.ACTIVE ? DRIVER_STATES.INACTIVE : DRIVER_STATES.ACTIVE;
      await firebaseService.update(COLLECTIONS.DRIVERS, driver.id, { state: newState });
      
      setDrivers(drivers.map(d => 
        d.id === driver.id ? new Driver({ ...d, state: newState }) : d
      ));
      
      setSuccess(`Conductor ${newState === DRIVER_STATES.ACTIVE ? 'activado' : 'desactivado'} exitosamente`);
    } catch (err) {
      setError('Error cambiando estado del conductor: ' + err.message);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <h1>Gestión de Conductores</h1>
        <button 
          className="btn btn-primary"
          onClick={handleCreateDriver}
        >
          Nuevo Conductor
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

      {/* Lista de conductores */}
      {loading ? (
        <div className="text-center py-lg">
          <div className="loading"></div>
          <p className="mt-md text-gray">Cargando conductores...</p>
        </div>
      ) : (
        <DriverList 
          drivers={drivers}
          onEdit={handleEditDriver}
          onDelete={handleDeleteDriver}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Modal para crear/editar conductor */}
      {showModal && (
        <Modal
          title={editingDriver ? 'Editar Conductor' : 'Nuevo Conductor'}
          onClose={() => setShowModal(false)}
        >
          <DriverForm
            driver={editingDriver}
            onSave={handleSaveDriver}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Drivers;