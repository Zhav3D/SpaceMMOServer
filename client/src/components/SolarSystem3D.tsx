import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useQuery } from '@tanstack/react-query';

interface SolarSystem3DProps {
  celestialBodies: any[];
  isLoading?: boolean;
  onSelectBody?: (body: any) => void;
}

export default function SolarSystem3D({ 
  celestialBodies = [], 
  isLoading = false,
  onSelectBody
}: SolarSystem3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const objectsRef = useRef<Map<number, THREE.Object3D>>(new Map());
  const orbitLinesRef = useRef<Map<number, THREE.Line>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  // Use a larger scale factor to make planets visible (not to actual scale)
  const [scale, setScale] = useState<number>(5e-9); // 10x larger than before for better visibility
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
  
  // Get simulation speed for animation
  const { data: simulationData } = useQuery({
    queryKey: ["/api/celestial/simulation/speed"],
    refetchInterval: 3000
  });
  
  const simulationSpeed = simulationData?.data?.simulationSpeed || 1;
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 2.0, 0, 0);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    
    // Add camera
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
    camera.position.set(0, 200, 400);
    cameraRef.current = camera;
    
    // Add renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.autoRotate = false;
    controlsRef.current = controls;
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(2000, 20, 0x555555, 0x222222);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);
    
    // Add coordinate axes helper
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);
    
    // Add event listener for mouse clicks
    const handleMouseClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      
      if (cameraRef.current && sceneRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        
        // Get all celestial body objects
        const celestialObjects: THREE.Object3D[] = [];
        objectsRef.current.forEach(obj => celestialObjects.push(obj));
        
        const intersects = raycasterRef.current.intersectObjects(celestialObjects);
        
        if (intersects.length > 0) {
          const clicked = intersects[0].object;
          const bodyId = clicked.userData.bodyId;
          
          if (bodyId !== undefined) {
            setSelectedBodyId(bodyId);
            
            if (onSelectBody) {
              const selectedBody = celestialBodies.find(body => body.id === bodyId);
              if (selectedBody) {
                onSelectBody(selectedBody);
              }
            }
          }
        }
      }
    };
    
    containerRef.current.addEventListener('click', handleMouseClick);
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // Cleanup on unmount
    return () => {
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        containerRef.current.removeEventListener('click', handleMouseClick);
      }
      
      window.removeEventListener('resize', handleResize);
      
      // Dispose of Three.js objects
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);
  
  // Update objects when celestial bodies change
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Clear previous objects
    objectsRef.current.forEach(object => {
      if (sceneRef.current) {
        sceneRef.current.remove(object);
      }
    });
    
    orbitLinesRef.current.forEach(line => {
      if (sceneRef.current) {
        sceneRef.current.remove(line);
      }
    });
    
    objectsRef.current.clear();
    orbitLinesRef.current.clear();
    
    // Group celestial bodies by parent
    const bodiesByParent = celestialBodies.reduce((acc, body) => {
      const parentId = body.parentBodyId || 'root';
      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(body);
      return acc;
    }, {} as Record<string | number, any[]>);
    
    // Sun or central body (root level)
    const rootBodies = bodiesByParent['root'] || [];
    
    rootBodies.forEach(body => {
      // Create the central body (sun)
      createCelestialBody(body);
      
      // Create its children (planets)
      const childBodies = bodiesByParent[body.id] || [];
      childBodies.forEach(childBody => {
        createCelestialBody(childBody);
        createOrbitLine(childBody);
        
        // Create moons and stations orbiting planets
        const grandchildBodies = bodiesByParent[childBody.id] || [];
        grandchildBodies.forEach(grandchildBody => {
          createCelestialBody(grandchildBody);
          createOrbitLine(grandchildBody);
        });
      });
    });
    
    // Helper function to create a celestial body
    function createCelestialBody(body: any) {
      const position = new THREE.Vector3(
        body.currentPositionX || 0,
        body.currentPositionY || 0,
        body.currentPositionZ || 0
      );
      
      // Scale position for visualization
      position.multiplyScalar(scale);
      
      // Scale radius for visualization (logarithmic scale for better visibility)
      // Use a much larger factor to make planets visible - not to scale with actual size
      const scaledRadius = Math.max(3, Math.log10(body.radius) * 2.5);
      
      let geometry, material, mesh;
      
      // Create different geometries based on type
      switch (body.type) {
        case 'star':
          geometry = new THREE.SphereGeometry(scaledRadius * 2, 32, 32);
          // Use MeshPhongMaterial for star since it supports emissive properties
          material = new THREE.MeshPhongMaterial({ 
            color: body.color || 0xffcc00,
            emissive: body.color || 0xffcc00,
            emissiveIntensity: 1.0,
            shininess: 100
          });
          
          // Add glow effect for star
          const starLight = new THREE.PointLight(0xffffff, 1.5, 0, 1.0);
          starLight.position.copy(position);
          sceneRef.current?.add(starLight);
          break;
          
        case 'planet':
          geometry = new THREE.SphereGeometry(scaledRadius, 32, 16);
          material = new THREE.MeshStandardMaterial({ 
            color: body.color || 0x3498db,
            roughness: 0.7,
            metalness: 0.0
          });
          break;
          
        case 'moon':
          geometry = new THREE.SphereGeometry(scaledRadius * 0.8, 16, 16);
          material = new THREE.MeshStandardMaterial({ 
            color: body.color || 0xcccccc,
            roughness: 0.8,
            metalness: 0.1
          });
          break;
          
        case 'asteroid':
          // Create irregular shape for asteroid
          geometry = new THREE.IcosahedronGeometry(scaledRadius * 0.5, 0);
          material = new THREE.MeshStandardMaterial({ 
            color: body.color || 0x8B4513,
            roughness: 1.0,
            metalness: 0.2
          });
          break;
          
        case 'station':
          // Create box shape for space station
          geometry = new THREE.BoxGeometry(scaledRadius, scaledRadius * 1.5, scaledRadius);
          material = new THREE.MeshStandardMaterial({ 
            color: body.color || 0xffffff,
            roughness: 0.3,
            metalness: 0.7
          });
          break;
          
        default:
          geometry = new THREE.SphereGeometry(scaledRadius, 16, 16);
          material = new THREE.MeshStandardMaterial({ 
            color: body.color || 0xa0a0a0,
            roughness: 0.5,
            metalness: 0.5
          });
      }
      
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      
      // Add reference to the body
      mesh.userData = { 
        bodyId: body.id,
        bodyType: body.type,
        bodyName: body.name,
        orbitProgress: body.orbitProgress || 0
      };
      
      // If this is the selected body, add highlight
      if (body.id === selectedBodyId) {
        const highlightMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xffff00, 
          wireframe: true,
          transparent: true,
          opacity: 0.3
        });
        
        const highlightGeometry = new THREE.SphereGeometry(scaledRadius * 1.2, 16, 16);
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        mesh.add(highlight);
      }
      
      if (sceneRef.current) {
        sceneRef.current.add(mesh);
      }
      
      objectsRef.current.set(body.id, mesh);
    }
    
    // Helper function to create orbit lines
    function createOrbitLine(body: any) {
      if (!body.parentBodyId) return;
      
      const segments = 64;
      const curve = new THREE.EllipseCurve(
        0, 0,                                      // center x, y
        body.semiMajorAxis * scale,                // xRadius
        body.semiMajorAxis * scale * (1 - body.eccentricity), // yRadius
        0, 2 * Math.PI,                            // start angle, end angle
        false,                                     // clockwise
        0                                          // rotation
      );
      
      const points = curve.getPoints(segments);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.rotateX(Math.PI / 2); // Rotate to XZ plane (top down view)
      
      // Rotate for inclination
      geometry.rotateZ(body.inclination || 0);
      
      // Rotate for longitude of ascending node
      geometry.rotateY(body.longitudeOfAscendingNode || 0);
      
      // Rotate for argument of periapsis
      geometry.rotateZ(body.argumentOfPeriapsis || 0);
      
      const material = new THREE.LineBasicMaterial({ 
        color: body.type === 'moon' || body.type === 'station' ? 0x555555 : 0x444444,
        transparent: true,
        opacity: 0.4
      });
      
      const line = new THREE.Line(geometry, material);
      
      // Get parent position
      const parentBody = celestialBodies.find(b => b.id === body.parentBodyId);
      if (parentBody) {
        const parentPos = new THREE.Vector3(
          parentBody.currentPositionX || 0,
          parentBody.currentPositionY || 0,
          parentBody.currentPositionZ || 0
        );
        
        // Scale position
        parentPos.multiplyScalar(scale);
        line.position.copy(parentPos);
      }
      
      if (sceneRef.current) {
        sceneRef.current.add(line);
      }
      
      orbitLinesRef.current.set(body.id, line);
    }
    
  }, [celestialBodies, scale, selectedBodyId]);
  
  // Update positions for animation
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - lastUpdate) / 1000; // in seconds
      setLastUpdate(now);
      
      objectsRef.current.forEach((object, bodyId) => {
        const body = celestialBodies.find(b => b.id === bodyId);
        if (!body) return;
        
        // Skip the central body (sun)
        if (!body.parentBodyId) return;
        
        // Get current orbital progress
        const progress = body.orbitProgress || 0;
        
        // Get parent position
        const parentBody = celestialBodies.find(b => b.id === body.parentBodyId);
        if (!parentBody) return;
        
        const parentPos = new THREE.Vector3(
          parentBody.currentPositionX || 0,
          parentBody.currentPositionY || 0,
          parentBody.currentPositionZ || 0
        );
        
        // Use current position from server data
        const currentPos = new THREE.Vector3(
          body.currentPositionX || 0,
          body.currentPositionY || 0,
          body.currentPositionZ || 0
        );
        
        // Scale positions
        const scaledParentPos = parentPos.clone().multiplyScalar(scale);
        const scaledCurrentPos = currentPos.clone().multiplyScalar(scale);
        
        // Set object position relative to parent
        object.position.copy(scaledCurrentPos);
        
        // Simple rotation for visualization
        if (body.type === 'planet' || body.type === 'moon') {
          object.rotation.y += deltaTime * 0.2 * simulationSpeed;
        }
      });
    }, 16); // ~60fps
    
    return () => clearInterval(updateInterval);
  }, [celestialBodies, lastUpdate, scale, simulationSpeed]);
  
  const handleIncreaseScale = () => {
    setScale(prev => prev * 1.5);
  };
  
  const handleDecreaseScale = () => {
    setScale(prev => prev / 1.5);
  };
  
  const handleResetScale = () => {
    setScale(5e-9); // Match the default scale
  };
  
  return (
    <div className="relative w-full h-[600px] bg-black rounded-lg">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="text-white">Loading solar system...</div>
        </div>
      )}
      
      {/* 3D container */}
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-md text-white">
        <button 
          onClick={handleDecreaseScale} 
          className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700"
        >
          -
        </button>
        <button 
          onClick={handleResetScale} 
          className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700"
        >
          Reset
        </button>
        <button 
          onClick={handleIncreaseScale} 
          className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700"
        >
          +
        </button>
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 p-2 rounded-md text-white text-xs">
        <div className="mb-1">Controls:</div>
        <div>Left click + drag: Rotate</div>
        <div>Right click + drag: Pan</div>
        <div>Scroll: Zoom</div>
        <div>Click on object: Select</div>
      </div>
    </div>
  );
}