import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Trash2, 
  Sparkles,
  Move
} from 'lucide-react';

// ─── Componente React para la vista del nodo de Imagen Redimensionable ───
export function ResizableImageComponent({ node, updateAttributes, deleteNode, selected }) {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(node.attrs.width || '100%');
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const alignment = node.attrs.alignment || 'center';

  useEffect(() => {
    if (node.attrs.width) {
      setCurrentWidth(node.attrs.width);
    }
  }, [node.attrs.width]);

  // Manejo de cambio de alineación
  const setAlignment = (newAlign) => {
    updateAttributes({ alignment: newAlign });
  };

  // Manejo de presets de tamaño rápido (25%, 50%, 75%, 100%)
  const setQuickSize = (sizePercentage) => {
    const widthVal = `${sizePercentage}%`;
    setCurrentWidth(widthVal);
    updateAttributes({ width: widthVal });
  };

  // Iniciar arrastre de redimensionamiento
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX || (e.touches && e.touches[0].clientX);
    const startWidth = imgRef.current ? imgRef.current.offsetWidth : 300;
    const parentWidth = containerRef.current ? containerRef.current.parentElement.offsetWidth : 800;

    const handlePointerMove = (moveEvent) => {
      const clientX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
      if (!clientX) return;

      const deltaX = direction.includes('right') ? clientX - startX : startX - clientX;
      let newPixelWidth = Math.max(80, Math.min(parentWidth, startWidth + deltaX));
      
      // Calcular porcentaje respecto al contenedor padre
      const percentage = Math.round((newPixelWidth / parentWidth) * 100);
      const formattedWidth = `${Math.min(100, Math.max(15, percentage))}%`;
      
      setCurrentWidth(formattedWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      // Guardar el tamaño final en los atributos del nodo
      if (imgRef.current && containerRef.current) {
        const parentWidth = containerRef.current.parentElement.offsetWidth || 800;
        const currentPixel = imgRef.current.offsetWidth;
        const finalPercent = `${Math.min(100, Math.max(15, Math.round((currentPixel / parentWidth) * 100)))}%`;
        updateAttributes({ width: finalPercent });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  const getAlignmentClasses = () => {
    switch (alignment) {
      case 'left':
        return 'mr-auto ml-0 text-left';
      case 'right':
        return 'ml-auto mr-0 text-right';
      case 'center':
      default:
        return 'mx-auto text-center';
    }
  };

  return (
    <NodeViewWrapper
      ref={containerRef}
      className={`relative my-5 select-none transition-all ${getAlignmentClasses()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`relative inline-block group max-w-full rounded-2xl transition-all duration-150 ${
          selected || isHovered || isResizing 
            ? 'ring-2 ring-[#15326C] dark:ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 shadow-md' 
            : ''
        }`}
        style={{ width: currentWidth, maxWidth: '100%' }}
      >
        {/* Barra de herramientas contextual flotante */}
        {(selected || isHovered || isResizing) && (
          <div 
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Presets de tamaño rápido */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-700">
              <button
                type="button"
                onClick={() => setQuickSize(25)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${currentWidth === '25%' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                title="Tamaño Pequeño (25%)"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setQuickSize(50)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${currentWidth === '50%' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                title="Tamaño Mediano (50%)"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setQuickSize(75)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${currentWidth === '75%' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                title="Tamaño Grande (75%)"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setQuickSize(100)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${currentWidth === '100%' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                title="Ancho Completo (100%)"
              >
                100%
              </button>
            </div>

            {/* Selector de alineación */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-700">
              <button
                type="button"
                onClick={() => setAlignment('left')}
                className={`p-1 rounded transition-colors ${alignment === 'left' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                title="Alinear a la izquierda"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlignment('center')}
                className={`p-1 rounded transition-colors ${alignment === 'center' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                title="Centrar imagen"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlignment('right')}
                className={`p-1 rounded transition-colors ${alignment === 'right' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                title="Alinear a la derecha"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Botón de eliminación */}
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 rounded hover:bg-red-600 text-slate-300 hover:text-white transition-colors"
              title="Eliminar imagen"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Imagen principal */}
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          title={node.attrs.title || ''}
          className="w-full h-auto rounded-2xl block object-contain border border-slate-200 dark:border-slate-800 shadow-sm"
          draggable={false}
        />

        {/* Controles de redimensionamiento en las esquinas */}
        {(selected || isHovered || isResizing) && (
          <>
            {/* Esquina superior izquierda */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'top-left')}
              className="absolute -top-2 -left-2 w-4 h-4 bg-[#15326C] dark:bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize z-30 shadow-md hover:scale-125 transition-transform"
              title="Arrastrar para redimensionar"
            />
            {/* Esquina superior derecha */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'top-right')}
              className="absolute -top-2 -right-2 w-4 h-4 bg-[#15326C] dark:bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize z-30 shadow-md hover:scale-125 transition-transform"
              title="Arrastrar para redimensionar"
            />
            {/* Esquina inferior izquierda */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'bottom-left')}
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#15326C] dark:bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize z-30 shadow-md hover:scale-125 transition-transform"
              title="Arrastrar para redimensionar"
            />
            {/* Esquina inferior derecha */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'bottom-right')}
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#15326C] dark:bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize z-30 shadow-md hover:scale-125 transition-transform"
              title="Arrastrar para redimensionar"
            />

            {/* Badge indicador de ancho actual durante el redimensionamiento */}
            {isResizing && (
              <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-md pointer-events-none z-30">
                {currentWidth}
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ─── Extensión de TipTap Node ───
export const ResizableImage = Node.create({
  name: 'image',

  group: 'block',
  selectable: true,
  draggable: true,
  inline: false,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: '100%',
        renderHTML: (attributes) => {
          return {
            'data-width': attributes.width,
            style: `width: ${attributes.width || '100%'}; max-width: 100%; height: auto;`,
          };
        },
      },
      alignment: {
        default: 'center',
        renderHTML: (attributes) => {
          const align = attributes.alignment || 'center';
          let marginStyle = 'margin-left: auto; margin-right: auto; display: block;';
          if (align === 'left') {
            marginStyle = 'margin-right: auto; margin-left: 0; display: block;';
          } else if (align === 'right') {
            marginStyle = 'margin-left: auto; margin-right: 0; display: block;';
          }
          return {
            'data-align': align,
            style: `width: ${attributes.width || '100%'}; ${marginStyle} max-width: 100%; height: auto;`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return {};
          const styleWidth = dom.style.width || dom.getAttribute('width') || dom.getAttribute('data-width');
          const styleAlign = dom.getAttribute('data-align') || (dom.style.marginLeft === 'auto' && dom.style.marginRight === 'auto' ? 'center' : dom.style.marginLeft === '0px' || dom.style.marginLeft === '0' ? 'left' : dom.style.marginRight === '0px' || dom.style.marginRight === '0' ? 'right' : 'center');
          return {
            src: dom.getAttribute('src'),
            alt: dom.getAttribute('alt'),
            title: dom.getAttribute('title'),
            width: styleWidth || '100%',
            alignment: styleAlign || 'center',
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const width = node.attrs.width || '100%';
    const align = node.attrs.alignment || 'center';
    
    let marginStyle = 'margin-left: auto; margin-right: auto; display: block;';
    if (align === 'left') {
      marginStyle = 'margin-right: auto; margin-left: 0; display: block;';
    } else if (align === 'right') {
      marginStyle = 'margin-left: auto; margin-right: 0; display: block;';
    }

    const merged = mergeAttributes(HTMLAttributes, {
      style: `width: ${width}; ${marginStyle} max-width: 100%; height: auto; border-radius: 0.75rem;`,
      class: 'rounded-xl my-4 shadow-sm',
    });

    return ['img', merged];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            ...options,
            width: options.width || '100%',
            alignment: options.alignment || 'center',
          },
        });
      },
    };
  },
});
