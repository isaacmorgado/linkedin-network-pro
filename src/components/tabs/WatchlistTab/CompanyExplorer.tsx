/**
 * Company Explorer Component
 * Display company employee map with filtering and pathfinding
 */

import { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  X,
  Users,
  GitBranch,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import type { CompanyMap, CompanyEmployee } from '../../../types/network';

interface CompanyExplorerProps {
  companyMap: CompanyMap | null;
  onFindPath: (employee: CompanyEmployee) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function CompanyExplorer({
  companyMap,
  onFindPath,
  onClose,
  isLoading = false,
}: CompanyExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDegree, setSelectedDegree] = useState<number | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<CompanyEmployee | null>(null);

  // Extract unique departments and roles
  const { departments, roles } = useMemo(() => {
    if (!companyMap) return { departments: [], roles: [] };

    const depts = new Set<string>();
    const roleSet = new Set<string>();

    companyMap.employees.forEach((emp) => {
      if (emp.department) depts.add(emp.department);
      if (emp.role) roleSet.add(emp.role);
    });

    return {
      departments: Array.from(depts).sort(),
      roles: Array.from(roleSet).sort(),
    };
  }, [companyMap]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    if (!companyMap) return [];

    return companyMap.employees.filter((emp) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          emp.name.toLowerCase().includes(query) ||
          emp.role?.toLowerCase().includes(query) ||
          emp.headline?.toLowerCase().includes(query) ||
          emp.department?.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Department filter
      if (selectedDepartment !== 'all' && emp.department !== selectedDepartment) {
        return false;
      }

      // Role filter
      if (selectedRole !== 'all' && emp.role !== selectedRole) {
        return false;
      }

      // Connection degree filter
      if (selectedDegree !== 'all' && emp.connectionDegree !== selectedDegree) {
        return false;
      }

      return true;
    });
  }, [companyMap, searchQuery, selectedDepartment, selectedRole, selectedDegree]);

  // Group by connection degree
  const employeesByDegree = useMemo(() => {
    const groups: Record<number, CompanyEmployee[]> = { 1: [], 2: [], 3: [] };

    filteredEmployees.forEach((emp) => {
      if (emp.connectionDegree >= 1 && emp.connectionDegree <= 3) {
        groups[emp.connectionDegree].push(emp);
      }
    });

    return groups;
  }, [filteredEmployees]);

  const handleEmployeeClick = (employee: CompanyEmployee) => {
    setSelectedEmployee(employee);
    onFindPath(employee);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('all');
    setSelectedRole('all');
    setSelectedDegree('all');
  };

  if (!companyMap) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
        }}
      >
        <Building2 size={48} color="#6e6e73" strokeWidth={1.5} />
        <p
          style={{
            fontSize: '14px',
            color: '#6e6e73',
            margin: '16px 0 0 0',
          }}
        >
          No company data available
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} color="#0077B5" />
            <div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: 0,
                  color: '#1d1d1f',
                }}
              >
                {companyMap.companyName}
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6e6e73',
                  margin: '2px 0 0 0',
                }}
              >
                {companyMap.employees.length} employees • {filteredEmployees.length} shown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} color="#6e6e73" />
          </button>
        </div>

        {/* Search & Filters */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            flexShrink: 0,
          }}
        >
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search
              size={18}
              color="#6e6e73"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees by name, role, or department..."
              style={{
                width: '100%',
                height: '40px',
                padding: '0 40px 0 40px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 150ms',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0077B5';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 119, 181, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  border: 'none',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} color="#6e6e73" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '6px 12px',
                backgroundColor: showFilters ? 'rgba(0, 119, 181, 0.1)' : 'transparent',
                color: showFilters ? '#0077B5' : '#6e6e73',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 150ms',
              }}
            >
              <Filter size={14} />
              Filters
              <ChevronDown
                size={14}
                style={{
                  transform: showFilters ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 150ms',
                }}
              />
            </button>

            {(selectedDepartment !== 'all' || selectedRole !== 'all' || selectedDegree !== 'all') && (
              <button
                onClick={handleClearFilters}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: '#6e6e73',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div
              style={{
                marginTop: '12px',
                padding: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              {/* Department Filter */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6e6e73',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 12px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6e6e73',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 12px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Connection Degree Filter */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6e6e73',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Connection
                </label>
                <select
                  value={selectedDegree}
                  onChange={(e) => setSelectedDegree(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 12px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Connections</option>
                  <option value={1}>1st Degree</option>
                  <option value={2}>2nd Degree</option>
                  <option value={3}>3rd Degree</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Employee List */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px 24px',
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
              }}
            >
              <Loader2
                size={32}
                color="#0077B5"
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p
                style={{
                  fontSize: '14px',
                  color: '#6e6e73',
                  margin: '16px 0 0 0',
                }}
              >
                Loading employees...
              </p>
              <style>
                {`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}
              </style>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <Users size={48} color="#6e6e73" strokeWidth={1.5} />
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  margin: '16px 0 4px 0',
                }}
              >
                No employees found
              </p>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6e6e73',
                  margin: 0,
                }}
              >
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Group by connection degree */}
              {[1, 2, 3].map((degree) => {
                const employees = employeesByDegree[degree];
                if (employees.length === 0) return null;

                return (
                  <div key={degree}>
                    <h3
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#6e6e73',
                        margin: '0 0 12px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>{degree === 1 ? '1st' : degree === 2 ? '2nd' : '3rd'} Degree</span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        {employees.length}
                      </span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {employees.map((employee) => (
                        <EmployeeCard
                          key={employee.profileId}
                          employee={employee}
                          onFindPath={() => handleEmployeeClick(employee)}
                          isSelected={selectedEmployee?.profileId === employee.profileId}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EmployeeCardProps {
  employee: CompanyEmployee;
  onFindPath: () => void;
  isSelected: boolean;
}

function EmployeeCard({ employee, onFindPath, isSelected }: EmployeeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        padding: '12px',
        border: isSelected ? '2px solid #0077B5' : '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '10px',
        backgroundColor: isSelected ? 'rgba(0, 119, 181, 0.03)' : '#FFFFFF',
        transition: 'all 150ms',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onFindPath}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '600',
                margin: 0,
                color: '#1d1d1f',
              }}
            >
              {employee.name}
            </h4>
            {employee.connectionDegree > 0 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor:
                    employee.connectionDegree === 1
                      ? 'rgba(16, 185, 129, 0.1)'
                      : employee.connectionDegree === 2
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'rgba(245, 158, 11, 0.1)',
                  color:
                    employee.connectionDegree === 1 ? '#10B981' : employee.connectionDegree === 2 ? '#3B82F6' : '#F59E0B',
                }}
              >
                {employee.connectionDegree === 1 ? '1st' : employee.connectionDegree === 2 ? '2nd' : '3rd'}
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: '13px',
              color: '#6e6e73',
              margin: '0 0 4px 0',
            }}
          >
            {employee.role}
          </p>

          {employee.department && (
            <p
              style={{
                fontSize: '12px',
                color: '#6e6e73',
                margin: 0,
              }}
            >
              {employee.department}
            </p>
          )}

          {employee.mutualConnections && employee.mutualConnections.length > 0 && (
            <p
              style={{
                fontSize: '12px',
                color: '#0077B5',
                margin: '6px 0 0 0',
                fontWeight: '600',
              }}
            >
              {employee.mutualConnections.length} mutual connection{employee.mutualConnections.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {isHovered && (
          <button
            style={{
              padding: '6px 12px',
              backgroundColor: '#0077B5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#006399';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0077B5';
            }}
          >
            <GitBranch size={12} />
            Path
          </button>
        )}
      </div>
    </div>
  );
}
