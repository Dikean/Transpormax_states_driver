/**
 * @fileoverview Componente selector de departamento
 * @author VehicleManager Team
 * @version 1.0.0
 */

import React from 'react';
import { DEPARTMENTS, DEPARTMENT_INFO } from '../constants/index.js';

/**
 * @typedef {Object} DepartmentSelectorProps
 * @property {string} selectedDepartment - Departamento seleccionado actualmente
 * @property {Function} onDepartmentChange - Callback cuando cambia la selección
 * @property {boolean} [disabled] - Si el selector está deshabilitado
 * @property {string} [className] - Clases CSS adicionales
 * @property {boolean} [showIcons] - Si mostrar iconos de departamentos
 */

/**
 * Componente para seleccionar departamento (Sucre o Córdoba)
 * 
 * Características:
 * - Botones visuales con colores distintivos
 * - Iconos representativos para cada departamento
 * - Estado activo/inactivo claro
 * - Responsive design
 * 
 * @param {DepartmentSelectorProps} props - Props del componente
 * @returns {JSX.Element} Componente renderizado
 */
const DepartmentSelector = ({
  selectedDepartment = DEPARTMENTS.SUCRE,
  onDepartmentChange,
  disabled = false,
  className = '',
  showIcons = true
}) => {
  /**
   * Maneja el cambio de departamento
   * @param {string} department - Nuevo departamento seleccionado
   */
  const handleDepartmentChange = (department) => {
    if (disabled || department === selectedDepartment) return;
    
    if (onDepartmentChange && typeof onDepartmentChange === 'function') {
      onDepartmentChange(department);
    }
  };

  /**
   * Obtiene las clases CSS para un botón de departamento
   * @param {string} department - Departamento del botón
   * @returns {string} Clases CSS
   */
  const getButtonClasses = (department) => {
    const isSelected = selectedDepartment === department;
    const departmentInfo = DEPARTMENT_INFO[department];
    
    let classes = 'department-btn flex-1 p-md rounded-lg border-2 transition-all duration-200 cursor-pointer text-center';
    
    if (disabled) {
      classes += ' opacity-50 cursor-not-allowed';
    } else if (isSelected) {
      classes += ' border-primary bg-primary text-white shadow-md transform scale-105';
    } else {
      classes += ' border-border bg-white text-gray hover:border-secondary hover:bg-hover hover:shadow-sm';
    }
    
    return classes;
  };

  /**
   * Obtiene el estilo inline para el botón (colores personalizados)
   * @param {string} department - Departamento del botón
   * @returns {Object} Objeto de estilos
   */
  const getButtonStyle = (department) => {
    const isSelected = selectedDepartment === department;
    const departmentInfo = DEPARTMENT_INFO[department];
    
    if (isSelected) {
      return {
        backgroundColor: departmentInfo.color,
        borderColor: departmentInfo.color,
        boxShadow: `0 4px 12px ${departmentInfo.color}33`
      };
    }
    
    return {};
  };

  return (
    <div className={`department-selector ${className}`}>
      <div className="mb-sm">
        <label className="block text-sm font-medium text-gray mb-xs">
          Departamento *
        </label>
        <p className="text-xs text-gray">
          Selecciona el departamento al que pertenece esta información
        </p>
      </div>
      
      <div className="flex gap-md">
        {Object.values(DEPARTMENTS).map((department) => {
          const departmentInfo = DEPARTMENT_INFO[department];
          const isSelected = selectedDepartment === department;
          
          return (
            <button
              key={department}
              type="button"
              className={getButtonClasses(department)}
              style={getButtonStyle(department)}
              onClick={() => handleDepartmentChange(department)}
              disabled={disabled}
              title={departmentInfo.description}
            >
              <div className="flex flex-col items-center gap-xs">
                {showIcons && (
                  <span className="text-2xl" role="img" aria-label={departmentInfo.name}>
                    {departmentInfo.icon}
                  </span>
                )}
                
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {departmentInfo.name}
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-white opacity-90' : 'text-gray'}`}>
                    {departmentInfo.code}
                  </span>
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {selectedDepartment && (
        <div className="mt-sm p-sm bg-hover rounded border-l-4" 
             style={{ borderLeftColor: DEPARTMENT_INFO[selectedDepartment].color }}>
          <div className="flex items-center gap-xs text-xs text-gray">
            <span>{DEPARTMENT_INFO[selectedDepartment].icon}</span>
            <span>
              Seleccionado: <strong>{DEPARTMENT_INFO[selectedDepartment].name}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente simplificado para uso en formularios
 * @param {Object} props - Props del componente
 * @returns {JSX.Element} Selector simple
 */
export const SimpleDepartmentSelector = ({ 
  selectedDepartment, 
  onDepartmentChange, 
  disabled = false 
}) => {
  return (
    <div className="simple-department-selector">
      <label className="block text-sm font-medium text-gray mb-xs">
        Departamento
      </label>
      <select
        value={selectedDepartment}
        onChange={(e) => onDepartmentChange?.(e.target.value)}
        disabled={disabled}
        className="w-full p-sm border border-border rounded focus:outline-none focus:border-primary"
      >
        {Object.values(DEPARTMENTS).map((department) => {
          const departmentInfo = DEPARTMENT_INFO[department];
          return (
            <option key={department} value={department}>
              {departmentInfo.icon} {departmentInfo.name} ({departmentInfo.code})
            </option>
          );
        })}
      </select>
    </div>
  );
};

/**
 * Hook personalizado para gestionar estado de departamento
 * @param {string} initialDepartment - Departamento inicial
 * @returns {Array} [selectedDepartment, setSelectedDepartment, departmentInfo]
 */
export const useDepartmentSelector = (initialDepartment = DEPARTMENTS.SUCRE) => {
  const [selectedDepartment, setSelectedDepartment] = React.useState(initialDepartment);
  
  const departmentInfo = React.useMemo(() => {
    return DEPARTMENT_INFO[selectedDepartment] || DEPARTMENT_INFO[DEPARTMENTS.SUCRE];
  }, [selectedDepartment]);
  
  const handleDepartmentChange = React.useCallback((department) => {
    if (Object.values(DEPARTMENTS).includes(department)) {
      setSelectedDepartment(department);
    }
  }, []);
  
  return [selectedDepartment, handleDepartmentChange, departmentInfo];
};

export default DepartmentSelector;