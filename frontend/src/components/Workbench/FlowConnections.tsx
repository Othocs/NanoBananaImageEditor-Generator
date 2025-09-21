import React, { useMemo, useEffect, useState } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { calculateBezierPath, pathToSvgString, calculateArrowhead, getFlowAnimationPath } from '../../utils/pathCalculation';
import type { WorkbenchImage } from '../../types';

interface Connection {
  id: string;
  sourceImage: WorkbenchImage;
  targetImage: WorkbenchImage;
  path: string;
  arrowhead: string;
}

interface FlowParticle {
  id: string;
  connectionId: string;
  progress: number;
  opacity: number;
}

const FlowConnections: React.FC = () => {
  const { images, showFlowConnections } = useWorkbenchStore();
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [particles, setParticles] = useState<FlowParticle[]>([]);

  // Calculate all connections based on generation context
  const connections = useMemo(() => {
    if (!showFlowConnections) return [];

    const allConnections: Connection[] = [];
    
    // Find all images that were generated from other images
    images.forEach(targetImage => {
      if (targetImage.generationContext?.contextImageIds) {
        targetImage.generationContext.contextImageIds.forEach(sourceId => {
          const sourceImage = images.find(img => img.id === sourceId);
          if (sourceImage) {
            const bezierPath = calculateBezierPath(
              { position: sourceImage.position, size: sourceImage.size },
              { position: targetImage.position, size: targetImage.size }
            );
            
            allConnections.push({
              id: `${sourceId}-${targetImage.id}`,
              sourceImage,
              targetImage,
              path: pathToSvgString(bezierPath),
              arrowhead: calculateArrowhead(bezierPath)
            });
          }
        });
      }
    });
    
    return allConnections;
  }, [images, showFlowConnections]);

  // Animate particles along paths
  useEffect(() => {
    if (!showFlowConnections || connections.length === 0) {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      setParticles(prevParticles => {
        // Update existing particles
        let updatedParticles = prevParticles.map(particle => ({
          ...particle,
          progress: particle.progress + 0.015,
          opacity: particle.progress < 0.1 ? particle.progress * 10 : 
                  particle.progress > 0.9 ? (1 - particle.progress) * 10 : 1
        })).filter(p => p.progress <= 1);

        // Add new particles periodically
        connections.forEach(connection => {
          const existingForConnection = updatedParticles.filter(
            p => p.connectionId === connection.id
          );
          
          // Maintain 3 particles per connection with spacing
          if (existingForConnection.length < 3) {
            const lastParticle = existingForConnection[existingForConnection.length - 1];
            if (!lastParticle || lastParticle.progress > 0.33) {
              updatedParticles.push({
                id: `${connection.id}-${Date.now()}-${Math.random()}`,
                connectionId: connection.id,
                progress: 0,
                opacity: 0
              });
            }
          }
        });

        return updatedParticles;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [showFlowConnections, connections]);

  if (!showFlowConnections || connections.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <defs>
        {/* Gradient definition for connection lines */}
        <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#a78bba" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
        </linearGradient>
        
        {/* Glow filter for connections */}
        <filter id="flow-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Enhanced glow for hover */}
        <filter id="flow-glow-hover">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Render connections */}
      <g className="flow-connections">
        {connections.map(connection => {
          const isHovered = hoveredConnection === connection.id;
          
          return (
            <g
              key={connection.id}
              className="flow-connection-group"
              onMouseEnter={() => setHoveredConnection(connection.id)}
              onMouseLeave={() => setHoveredConnection(null)}
              style={{ pointerEvents: 'visibleStroke' }}
            >
              {/* Connection path */}
              <path
                d={connection.path}
                fill="none"
                stroke="url(#flow-gradient)"
                strokeWidth={isHovered ? 3 : 2}
                strokeDasharray={isHovered ? "none" : "8 4"}
                opacity={isHovered ? 1 : 0.6}
                filter={isHovered ? "url(#flow-glow-hover)" : "url(#flow-glow)"}
                className="flow-path"
                style={{
                  transition: 'all 0.3s ease',
                  animation: isHovered ? 'none' : 'flow-dash 20s linear infinite'
                }}
              />
              
              {/* Arrowhead */}
              <path
                d={connection.arrowhead}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth={2}
                opacity={isHovered ? 1 : 0.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Particles */}
              {particles
                .filter(p => p.connectionId === connection.id)
                .map(particle => {
                  const bezierPath = calculateBezierPath(
                    { position: connection.sourceImage.position, size: connection.sourceImage.size },
                    { position: connection.targetImage.position, size: connection.targetImage.size }
                  );
                  const position = getFlowAnimationPath(bezierPath, particle.progress);
                  
                  return (
                    <circle
                      key={particle.id}
                      cx={position.x}
                      cy={position.y}
                      r={isHovered ? 4 : 3}
                      fill="#8b5cf6"
                      opacity={particle.opacity * (isHovered ? 1 : 0.8)}
                      filter="url(#flow-glow)"
                      className="flow-particle"
                    />
                  );
                })}
              
              {/* Connection label on hover */}
              {isHovered && connection.targetImage.generationContext?.prompt && (
                <g>
                  <rect
                    x={connection.targetImage.position.x + connection.targetImage.size.width / 2 - 100}
                    y={connection.targetImage.position.y - 30}
                    width={200}
                    height={24}
                    fill="#1a0f2e"
                    stroke="#8b5cf6"
                    strokeWidth={1}
                    rx={4}
                    opacity={0.9}
                  />
                  <text
                    x={connection.targetImage.position.x + connection.targetImage.size.width / 2}
                    y={connection.targetImage.position.y - 13}
                    textAnchor="middle"
                    fill="#e5e1f0"
                    fontSize={11}
                    fontFamily="monospace"
                  >
                    {connection.targetImage.generationContext.prompt.substring(0, 30)}
                    {connection.targetImage.generationContext.prompt.length > 30 ? '...' : ''}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default FlowConnections;