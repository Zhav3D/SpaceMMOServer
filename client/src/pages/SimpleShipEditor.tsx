import { useState, useEffect } from "react";

interface ShipTemplate {
  id?: string;
  name: string;
  type: "enemy" | "transport" | "civilian" | "mining";
  description?: string;
  mass: number;
  maxSpeed: number;
  maxAcceleration: number;
  turnRate: number;
  detectionRange: number;
  signatureRadius: number;
  attackRange: number;
  fleeThreshold: number;
  waypointArrivalDistance: number;
  obstacleAvoidanceDistance: number;
  formationKeepingTolerance: number;
  pathfindingUpdateInterval: number;
}

export default function SimpleShipEditor() {
  const [templates, setTemplates] = useState<ShipTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTemplate, setCurrentTemplate] = useState<ShipTemplate>({
    name: "New Ship",
    type: "enemy",
    description: "A standard ship template",
    mass: 1000,
    maxSpeed: 50,
    maxAcceleration: 10,
    turnRate: 0.1,
    detectionRange: 1000,
    signatureRadius: 100,
    attackRange: 500,
    fleeThreshold: 0.3,
    waypointArrivalDistance: 100,
    obstacleAvoidanceDistance: 200,
    formationKeepingTolerance: 50,
    pathfindingUpdateInterval: 5000
  });
  const [editMode, setEditMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  // Function to fetch templates
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ship-templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to save template
  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    console.log("Saving template:", currentTemplate);
    
    try {
      const url = editMode && currentTemplate.id 
        ? `/api/ship-templates/${currentTemplate.id}`
        : '/api/ship-templates';
        
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentTemplate),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save template');
      }
      
      await fetchTemplates();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Error saving template: " + error);
    }
  };
  
  // Function to delete template
  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    try {
      const response = await fetch(`/api/ship-templates/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      await fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Error deleting template: " + error);
    }
  };
  
  // Reset the form to default values
  const resetForm = () => {
    setCurrentTemplate({
      name: "New Ship",
      type: "enemy",
      description: "A standard ship template",
      mass: 1000,
      maxSpeed: 50,
      maxAcceleration: 10,
      turnRate: 0.1,
      detectionRange: 1000,
      signatureRadius: 100,
      attackRange: 500,
      fleeThreshold: 0.3,
      waypointArrivalDistance: 100,
      obstacleAvoidanceDistance: 200,
      formationKeepingTolerance: 50,
      pathfindingUpdateInterval: 5000
    });
    setEditMode(false);
  };
  
  // Handle creating a new template
  const handleNewTemplate = (type: "enemy" | "transport" | "civilian" | "mining") => {
    setEditMode(false);
    
    // Set default values based on ship type
    const template: ShipTemplate = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Ship`,
      type,
      description: `A standard ${type} ship template`,
      mass: type === 'transport' ? 2000 : (type === 'mining' ? 1500 : 1000),
      maxSpeed: type === 'enemy' ? 70 : (type === 'transport' ? 40 : (type === 'mining' ? 30 : 50)),
      maxAcceleration: type === 'enemy' ? 15 : (type === 'mining' ? 8 : 10),
      turnRate: type === 'enemy' ? 0.15 : (type === 'mining' ? 0.05 : 0.1),
      detectionRange: type === 'enemy' ? 1500 : 1000,
      signatureRadius: type === 'transport' ? 150 : (type === 'mining' ? 130 : 100),
      attackRange: type === 'enemy' ? 600 : 200,
      fleeThreshold: type === 'civilian' ? 0.7 : (type === 'enemy' ? 0.3 : 0.5),
      waypointArrivalDistance: 100,
      obstacleAvoidanceDistance: 200,
      formationKeepingTolerance: 50,
      pathfindingUpdateInterval: 5000
    };
    
    setCurrentTemplate(template);
    setShowForm(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number' || name === 'mass' || name === 'maxSpeed' || name === 'maxAcceleration' || 
        name === 'turnRate' || name === 'detectionRange' || name === 'signatureRadius' || 
        name === 'attackRange' || name === 'fleeThreshold' || name === 'waypointArrivalDistance' || 
        name === 'obstacleAvoidanceDistance' || name === 'formationKeepingTolerance' || 
        name === 'pathfindingUpdateInterval') {
      setCurrentTemplate(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      setCurrentTemplate(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Function to get ship type badge color
  const getShipTypeColor = (type: string): string => {
    switch(type) {
      case 'enemy': return '#fee2e2'; // Light red
      case 'transport': return '#dbeafe'; // Light blue
      case 'civilian': return '#dcfce7'; // Light green
      case 'mining': return '#fef3c7'; // Light amber
      default: return '#f3f4f6'; // Light gray
    }
  };
  
  // Handle editing a template
  const handleEditTemplate = (template: ShipTemplate) => {
    setEditMode(true);
    setCurrentTemplate(template);
    setShowForm(true);
  };
  
  // Handle duplicating a template
  const handleDuplicateTemplate = (template: ShipTemplate) => {
    const { id, ...rest } = template;
    setCurrentTemplate({
      ...rest,
      name: `${template.name} (Copy)`
    });
    setEditMode(false);
    setShowForm(true);
  };
  
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Simple Ship Editor</h1>
      
      {/* Create buttons */}
      <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Create New Ship Template</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleNewTemplate('enemy')}
            style={{ 
              padding: '12px 16px', 
              borderRadius: '6px', 
              border: '1px solid #ef4444', 
              backgroundColor: '#fee2e2',
              cursor: 'pointer'
            }}
          >
            Combat Ship
          </button>
          <button 
            onClick={() => handleNewTemplate('transport')}
            style={{ 
              padding: '12px 16px', 
              borderRadius: '6px', 
              border: '1px solid #3b82f6', 
              backgroundColor: '#dbeafe',
              cursor: 'pointer'
            }}
          >
            Transport Ship
          </button>
          <button 
            onClick={() => handleNewTemplate('civilian')}
            style={{ 
              padding: '12px 16px', 
              borderRadius: '6px', 
              border: '1px solid #22c55e', 
              backgroundColor: '#dcfce7',
              cursor: 'pointer'
            }}
          >
            Civilian Ship
          </button>
          <button 
            onClick={() => handleNewTemplate('mining')}
            style={{ 
              padding: '12px 16px', 
              borderRadius: '6px', 
              border: '1px solid #f59e0b', 
              backgroundColor: '#fef3c7',
              cursor: 'pointer'
            }}
          >
            Mining Ship
          </button>
        </div>
      </div>
      
      {/* Template form */}
      {showForm && (
        <div style={{ marginBottom: '30px', padding: '20px', borderRadius: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>{editMode ? 'Edit Ship Template' : 'Create New Ship Template'}</h2>
          
          <form onSubmit={saveTemplate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {/* Basic Info */}
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Ship Name:
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    value={currentTemplate.name}
                    onChange={handleInputChange}
                    required
                    style={{ 
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Ship Type:
                  </label>
                  <select 
                    name="type" 
                    value={currentTemplate.type}
                    onChange={handleInputChange}
                    style={{ 
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    <option value="enemy">Combat</option>
                    <option value="transport">Transport</option>
                    <option value="civilian">Civilian</option>
                    <option value="mining">Mining</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Description:
                  </label>
                  <input 
                    type="text" 
                    name="description" 
                    value={currentTemplate.description || ''}
                    onChange={handleInputChange}
                    style={{ 
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
              </div>
              
              {/* Performance */}
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Mass (tons): {currentTemplate.mass}
                  </label>
                  <input 
                    type="number" 
                    name="mass" 
                    value={currentTemplate.mass}
                    onChange={handleInputChange}
                    min="10"
                    max="10000"
                    style={{ 
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Max Speed (m/s): {currentTemplate.maxSpeed}
                  </label>
                  <input 
                    type="number" 
                    name="maxSpeed" 
                    value={currentTemplate.maxSpeed}
                    onChange={handleInputChange}
                    min="10"
                    max="200"
                    style={{ 
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Turn Rate (rad/s): {currentTemplate.turnRate}
                  </label>
                  <input 
                    type="number" 
                    name="turnRate" 
                    value={currentTemplate.turnRate}
                    onChange={handleInputChange}
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    style={{ 
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
              </div>
              
              {/* Combat */}
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Attack Range (m): {currentTemplate.attackRange}
                  </label>
                  <input 
                    type="number" 
                    name="attackRange" 
                    value={currentTemplate.attackRange}
                    onChange={handleInputChange}
                    min="0"
                    max="1000"
                    style={{ 
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Detection Range (m): {currentTemplate.detectionRange}
                  </label>
                  <input 
                    type="number" 
                    name="detectionRange" 
                    value={currentTemplate.detectionRange}
                    onChange={handleInputChange}
                    min="100"
                    max="5000"
                    style={{ 
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Flee Threshold (%): {(currentTemplate.fleeThreshold * 100).toFixed(0)}%
                  </label>
                  <input 
                    type="number" 
                    name="fleeThreshold" 
                    value={currentTemplate.fleeThreshold}
                    onChange={handleInputChange}
                    min="0"
                    max="1"
                    step="0.05"
                    style={{ 
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '6px', 
                  border: '1px solid #d1d5db',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '6px', 
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                {editMode ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Template cards */}
      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Ship Templates</h2>
        
        {isLoading ? (
          <p>Loading templates...</p>
        ) : templates.length === 0 ? (
          <p>No templates found. Create your first template.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {templates.map(template => (
              <div key={template.id} style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                overflow: 'hidden',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: getShipTypeColor(template.type),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{template.name}</h3>
                  <span style={{ 
                    fontSize: '12px', 
                    padding: '2px 8px', 
                    borderRadius: '9999px', 
                    backgroundColor: 'rgba(255,255,255,0.5)'
                  }}>
                    {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                  </span>
                </div>
                
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                    {template.description || `A ${template.type} ship template`}
                  </p>
                  
                  <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Mass:</span>
                      <span style={{ fontFamily: 'monospace' }}>{template.mass} tons</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Speed:</span>
                      <span style={{ fontFamily: 'monospace' }}>{template.maxSpeed} m/s</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Turn Rate:</span>
                      <span style={{ fontFamily: 'monospace' }}>{template.turnRate} rad/s</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Detection:</span>
                      <span style={{ fontFamily: 'monospace' }}>{template.detectionRange} m</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button 
                      onClick={() => deleteTemplate(template.id!)}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #ef4444',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => handleDuplicateTemplate(template)}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #d1d5db',
                        backgroundColor: '#f9fafb',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Clone
                    </button>
                    <button 
                      onClick={() => handleEditTemplate(template)}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #3b82f6',
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}