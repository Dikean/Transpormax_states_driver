import { useState, useEffect } from 'react';
import { DRIVER_STATES } from '../models';

const DriverForm = ({ driver, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    license: '',
    phone: '',
    email: '',
    state: DRIVER_STATES.ACTIVE
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || '',
        license: driver.license || '',
        phone: driver.phone || '',
        email: driver.email || '',
        state: driver.state || DRIVER_STATES.ACTIVE
      });
    }
  }, [driver]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.license.trim()) {
      newErrors.license = 'La licencia es requerida';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="name">
          Nombre *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`form-input ${errors.name ? 'border-error' : ''}`}
          placeholder="Nombre completo del conductor"
        />
        {errors.name && <div className="form-error">{errors.name}</div>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="license">
          Licencia *
        </label>
        <input
          type="text"
          id="license"
          name="license"
          value={formData.license}
          onChange={handleChange}
          className={`form-input ${errors.license ? 'border-error' : ''}`}
          placeholder="Número de licencia de conducir"
        />
        {errors.license && <div className="form-error">{errors.license}</div>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="phone">
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="form-input"
          placeholder="Número de teléfono"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="email">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`form-input ${errors.email ? 'border-error' : ''}`}
          placeholder="Correo electrónico"
        />
        {errors.email && <div className="form-error">{errors.email}</div>}
      </div>

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
          <option value={DRIVER_STATES.ACTIVE}>Activo</option>
          <option value={DRIVER_STATES.INACTIVE}>Inactivo</option>
        </select>
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
          {driver ? 'Actualizar' : 'Crear'} Conductor
        </button>
      </div>
    </form>
  );
};

export default DriverForm;