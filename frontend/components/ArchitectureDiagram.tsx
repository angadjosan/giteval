'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ArchitectureDiagramProps {
  diagram: string;
  className?: string;
}

export default function ArchitectureDiagram({
  diagram,
  className,
}: ArchitectureDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!diagram) {
      setError('No diagram available');
      setLoading(false);
      return;
    }

    let mounted = true;

    const renderDiagram = async () => {
      try {
        // Dynamically import mermaid to avoid SSR issues
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        });

        if (!containerRef.current || !mounted) return;

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, diagram);

        if (containerRef.current && mounted) {
          containerRef.current.innerHTML = svg;
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to render Mermaid diagram:', err);
        if (mounted) {
          setError('Failed to render diagram');
          setLoading(false);
        }
      }
    };

    renderDiagram();

    return () => {
      mounted = false;
    };
  }, [diagram]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('py-12', className)}>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border p-6', className)}>
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Architecture Diagram
      </h3>
      <div
        ref={containerRef}
        className="flex items-center justify-center overflow-x-auto"
      />
    </div>
  );
}
