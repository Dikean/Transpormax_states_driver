import { useState, useEffect } from 'react';
import { VEHICLE_STATES, DRIVER_STATES } from '../models';

const VehicleForm = ({ vehicle, drivers, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    state: VEHICLE_STATES.ACTIVE,
    currentDriverId: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vehicle) {
      setFormData({
        plate: vehicle.plate || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        state: vehicle.state || VEHICLE_STATES.ACTIVE,
        currentDriverId: vehicle.currentDriverId || ''
      });
    }
  }, [vehicle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) || '' : value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.plate.trim()) {
      newErrors.plate = 'La placa es requerida';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'La marca es requerida';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'El modelo es requerido';
    }

    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'El año debe estar entre 1900 y ' + (new Date().getFullYear() + 1);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const dataToSave = {
        ...formData,
        currentDriverId: formData.currentDriverId || null
      };
      onSave(dataToSave);
    }
  };

  // Filtrar conductores activos
  const activeDrivers = drivers.filter(driver => driver.state === DRIVER_STATES.ACTIVE);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-md">
        <div className="form-group">
          <label className="form-label" htmlFor="plate">
            Placa *
          </label>
          <input
            type="text"
            id="plate"
            name="plate"
            value={formData.plate}
            onChange={handleChange}
            className={`form-input ${errors.plate ? 'border-error' : ''}`}
            placeholder="ABC-123"
            style={{ textTransform: 'uppercase' }}
          />
          {errors.plate && <div className="form-error">{errors.plate}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="year">
            Año *
          </label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className={`form-input ${errors.year ? 'border-error' : ''}`}
            min="1900"
            max={new Date().getFullYear() + 1}
          />
          {errors.year && <div className="form-error">{errors.year}</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-md">
        <div className="form-group">
          <label className="form-label" htmlFor="brand">
            Marca *
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className={`form-input ${errors.brand ? 'border-error' : ''}`}
            placeholder="Toyota, Honda, etc."
          />
          {errors.brand && <div className="form-error">{errors.brand}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="model">
            Modelo *
          </label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className={`form-input ${errors.model ? 'border-error' : ''}`}
            placeholder="Corolla, Civic, etc."
          />
          {errors.model && <div className="form-error">{errors.model}</div>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="color">
          Color
        </label>
        <input
          type="text"
          id="color"
          name="color"
          value={formData.color}
          onChange={handleChange}
          className="form-input"
          placeholder="Blanco, Negro, Azul, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-md">
        <div className="form-group">
          <label className="form-label" htmlFor="state">
            Estado
          </label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="form-select"
          >
            <option value={VEHICLE_STATES.ACTIVE}>Activo</option>
            <option value={VEHICLE_STATES.INACTIVE}>Inactivo</option>
            <option value={VEHICLE_STATES.MAINTENANCE}>Mantenimiento</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="currentDriverId">
            Conductor Asignado
          </label>
          <select
            id="currentDriverId"
            name="currentDriverId"
            value={formData.currentDriverId}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Sin asignar</option>
            {activeDrivers.map(driver => (
              <option key={driver.id} value={driver.id}>
                {driver.name} ({driver.license})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-sm justify-end mt-lg">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
        >
          {vehicle ? 'Actualizar' : 'Crear'} Vehículo
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;