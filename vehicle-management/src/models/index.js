// Modelos de datos para la aplicación
import { DEPARTMENTS, DEPARTMENT_INFO, isValidEnumValue } from '../constants/index.js';

// Estados disponibles para vehículos
export const VEHICLE_STATES = {
  ACTIVE: 'activo',
  INACTIVE: 'inactivo', 
  MAINTENANCE: 'mantenimiento'
};

// Estados disponibles para conductores
export const DRIVER_STATES = {
  ACTIVE: 'activo',
  INACTIVE: 'inactivo'
};

// Modelo para Conductor
export class Driver {
  constructor({
    id = null,
    name = '',
    license = '',
    phone = '',
    email = '',
    state = DRIVER_STATES.ACTIVE,
    createdAt = null,
    updatedAt = null
  } = {}) {
    this.id = id;
    this.name = name;
    this.license = license;
    this.phone = phone;
    this.email = email;
    this.state = state;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Validar datos del conductor
  validate() {
    const errors = [];
    
    if (!this.name?.trim()) {
      errors.push('El nombre es requerido');
    }
    
    if (!this.license?.trim()) {
      errors.push('La licencia es requerida');
    }
    
    if (!Object.values(DRIVER_STATES).includes(this.state)) {
      errors.push('Estado de conductor inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convertir a objeto plano para Firebase
  toFirestore() {
    const { id, ...data } = this;
    return data;
  }
}

// Modelo para Vehículo
export class Vehicle {
  constructor({
    id = null,
    plate = '',
    brand = '',
    model = '',
    year = new Date().getFullYear(),
    color = '',
    state = VEHICLE_STATES.ACTIVE,
    currentDriverId = null,
    createdAt = null,
    updatedAt = null
  } = {}) {
    this.id = id;
    this.plate = plate;
    this.brand = brand;
    this.model = model;
    this.year = year;
    this.color = color;
    this.state = state;
    this.currentDriverId = currentDriverId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Validar datos del vehículo
  validate() {
    const errors = [];
    
    if (!this.plate?.trim()) {
      errors.push('La placa es requerida');
    }
    
    if (!this.brand?.trim()) {
      errors.push('La marca es requerida');
    }
    
    if (!this.model?.trim()) {
      errors.push('El modelo es requerido');
    }
    
    if (!this.year || this.year < 1900 || this.year > new Date().getFullYear() + 1) {
      errors.push('Año inválido');
    }
    
    if (!Object.values(VEHICLE_STATES).includes(this.state)) {
      errors.push('Estado de vehículo inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convertir a objeto plano para Firebase
  toFirestore() {
    const { id, ...data } = this;
    return data;
  }
}

// Modelo para Transferencia
export class Transfer {
  constructor({
    id = null,
    vehicleId = '',
    fromDriverId = null,
    toDriverId = '',
    transferDate = new Date(),
    reason = '',
    extractedText = '',
    source = 'manual', // 'manual' o 'whatsapp'
    department = DEPARTMENTS.SUCRE, // Departamento por defecto
    createdAt = null,
    updatedAt = null
  } = {}) {
    this.id = id;
    this.vehicleId = vehicleId;
    this.fromDriverId = fromDriverId;
    this.toDriverId = toDriverId;
    this.transferDate = transferDate;
    this.reason = reason;
    this.extractedText = extractedText;
    this.source = source;
    this.department = department;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Validar datos de la transferencia
  validate() {
    const errors = [];
    
    if (!this.vehicleId?.trim()) {
      errors.push('El ID del vehículo es requerido');
    }
    
    if (!this.toDriverId?.trim()) {
      errors.push('El conductor destino es requerido');
    }
    
    if (!this.transferDate) {
      errors.push('La fecha de transferencia es requerida');
    }
    
    if (!this.department || !isValidEnumValue(this.department, DEPARTMENTS)) {
      errors.push('Departamento inválido o no especificado');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convertir a objeto plano para Firebase
  toFirestore() {
    const { id, ...data } = this;
    return {
      ...data,
      transferDate: this.transferDate instanceof Date ? this.transferDate : new Date(this.transferDate)
    };
  }
}

// Colecciones de Firebase
export const COLLECTIONS = {
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  TRANSFERS: 'transfers'
};