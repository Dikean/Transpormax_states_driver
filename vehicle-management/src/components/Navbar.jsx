import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/drivers', label: 'Conductores' },
    { path: '/vehicles', label: 'Vehículos' },
    { path: '/transfers', label: 'Transferencias' },
    { path: '/upload', label: 'Procesar Chat' }
  ];

  return (
    <nav className="nav">
      <div className="container">
        <div className="flex items-center justify-between">
          <Link to="/" className="nav-brand">
            VehicleManager
          </Link>
          
          <ul className="nav-links">
            {navItems.map(item => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;