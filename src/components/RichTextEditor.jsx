import React, { useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { ResizableNodeView } from '@tiptap/core';
import { toast } from 'react-hot-toast';
import { subirArchivoOva } from '../lib/supabase';

// Patch ResizableNodeView to prevent ProseMirror click/drag interception and add diagnostic logging
if (typeof window !== 'undefined' && ResizableNodeView) {
  console.log('ResizableNodeView found in @tiptap/core, patching prototype...');

  const originalCreateContainer = ResizableNodeView.prototype.createContainer;
  ResizableNodeView.prototype.createContainer = function() {
    const el = originalCreateContainer.apply(this, arguments);
    if (el) {
      el.setAttribute('contenteditable', 'false');
      console.log('Container created with contenteditable="false"', el);
    }
    return el;
  };

  const originalCreateWrapper = ResizableNodeView.prototype.createWrapper;
  ResizableNodeView.prototype.createWrapper = function() {
    const el = originalCreateWrapper.apply(this, arguments);
    if (el) {
      el.setAttribute('contenteditable', 'false');
      console.log('Wrapper created with contenteditable="false"', el);
    }
    return el;
  };

  const originalCreateHandle = ResizableNodeView.prototype.createHandle;
  ResizableNodeView.prototype.createHandle = function(direction) {
    const el = originalCreateHandle.apply(this, arguments);
    if (el) {
      el.setAttribute('contenteditable', 'false');
      el.addEventListener('dragstart', e => e.preventDefault());
      console.log(`Handle created for direction "${direction}" with contenteditable="false"`);
    }
    return el;
  };

  const originalResizeStart = ResizableNodeView.prototype.handleResizeStart;
  ResizableNodeView.prototype.handleResizeStart = function(event, direction) {
    console.log(`Resize START triggered: direction=${direction}, target=`, event.target);
    try {
      originalResizeStart.apply(this, arguments);
      console.log(`Resize START successful: startWidth=${this.startWidth}, startHeight=${this.startHeight}, startX=${this.startX}, startY=${this.startY}`);
    } catch (err) {
      console.error('Error in handleResizeStart:', err);
    }
  };

  const originalResize = ResizableNodeView.prototype.handleResize;
  ResizableNodeView.prototype.handleResize = function(deltaX, deltaY) {
    console.log(`Resize DRAG: deltaX=${deltaX}, deltaY=${deltaY}`);
    try {
      originalResize.apply(this, arguments);
      console.log(`Resize DRAG successful: new width style=${this.element.style.width}, height style=${this.element.style.height}`);
    } catch (err) {
      console.error('Error in handleResize:', err);
    }
  };

  const originalMouseUp = ResizableNodeView.prototype.handleMouseUp;
  ResizableNodeView.prototype.handleMouseUp = function() {
    console.log('Resize END (mouseup)');
    try {
      originalMouseUp.apply(this, arguments);
      console.log('Resize END successful');
    } catch (err) {
      console.error('Error in handleMouseUp:', err);
    }
  };
}
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Heading2,
  Heading3,
  Undo,
  Redo,
  RemoveFormatting,
  Image as ImageIcon,
  Table as TableIcon
} from 'lucide-react';

const ToolbarButton = ({ onClick, active, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-lg transition-all duration-200 border border-transparent ${
      active
        ? 'bg-blue-50 text-[#1E3A8A] border-blue-200/50'
        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
    }`}
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-5 bg-card-border mx-0.5" />
);

export default function RichTextEditor({ 
  content = '', 
  onChange, 
  placeholder = 'Escribe aquí...', 
  minHeight = '180px',
  className = '' 
}) {
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#1E3A8A] underline hover:text-[#1D4ED8] transition-colors',
          target: '_blank',
          rel: 'noopener noreferrer',
          },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-slate-50 border border-card-border rounded-lg p-4 font-mono text-sm text-[#1E3A8A] my-4 overflow-x-auto',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TiptapImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-xl border border-card-border my-6 shadow-md block mx-auto',
        },
        resize: {
          enabled: true,
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-sm max-w-none focus:outline-none min-h-full',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const editorEl = editor.options.element;
    if (!editorEl) return;

    // Helper to dynamically set attributes on the actual DOM elements
    const patchElements = () => {
      // Find all resize containers
      const containers = editorEl.querySelectorAll('[data-resize-container]');
      containers.forEach(container => {
        if (container.getAttribute('contenteditable') !== 'false') {
          container.setAttribute('contenteditable', 'false');
          console.log('[Observer] Patched container contenteditable="false"');
        }
      });

      // Find all resize wrappers
      const wrappers = editorEl.querySelectorAll('[data-resize-wrapper]');
      wrappers.forEach(wrapper => {
        if (wrapper.getAttribute('contenteditable') !== 'false') {
          wrapper.setAttribute('contenteditable', 'false');
          console.log('[Observer] Patched wrapper contenteditable="false"');
        }
      });

      // Find all resize handles
      const handles = editorEl.querySelectorAll('[data-resize-handle]');
      handles.forEach(handle => {
        if (handle.getAttribute('contenteditable') !== 'false') {
          handle.setAttribute('contenteditable', 'false');
          
          // Disable native drag starts on handles
          handle.addEventListener('dragstart', e => {
            e.preventDefault();
            e.stopPropagation();
          }, { passive: false });
          
          // Prevent mousedown from bubbling up to ProseMirror selection handler
          handle.addEventListener('mousedown', e => {
            e.stopPropagation();
          }, { passive: false });

          handle.addEventListener('touchstart', e => {
            e.stopPropagation();
          }, { passive: false });

          console.log(`[Observer] Patched handle [${handle.getAttribute('data-resize-handle')}]`);
        }
      });
    };

    // Run patch immediately and on every update
    patchElements();

    const observer = new MutationObserver(patchElements);
    observer.observe(editorEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-resize-state']
    });

    editor.on('transaction', patchElements);
    editor.on('selectionUpdate', patchElements);

    return () => {
      observer.disconnect();
      editor.off('transaction', patchElements);
      editor.off('selectionUpdate', patchElements);
    };
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const toastId = toast.loading('Subiendo imagen...');
    try {
      const url = await subirArchivoOva(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      toast.success('Imagen insertada con éxito', { id: toastId });
    } catch (err) {
      console.error('Error al subir imagen de OVA:', err);
      toast.error('Error al subir la imagen: ' + err.message, { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!editor) return null;

  return (
    <div className={`rounded-xl border border-card-border bg-card overflow-hidden transition-all focus-within:border-[#1E3A8A]/50 focus-within:shadow-sm ${className}`}>
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Toolbar Container */}
      <div className="flex flex-col border-b border-card-border bg-slate-50">
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Negrita"
          >
            <Bold className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Cursiva"
          >
            <Italic className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Subrayado"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Tachado"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Título H2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Subtítulo H3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Lista"
          >
            <List className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Lista numerada"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Cita"
          >
            <Quote className="w-3.5 h-3.5" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Bloque de código"
          >
            <Code className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={setLink}
            active={editor.isActive('link')}
            title="Insertar enlace"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={triggerImageUpload}
            title="Insertar Imagen desde Computador"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insertar Tabla"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            title="Limpiar formato"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Deshacer"
          >
            <Undo className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Rehacer"
          >
            <Redo className="w-3.5 h-3.5" />
          </ToolbarButton>
        </div>

        {/* Dynamic Sub-toolbar for active Table controls */}
        {editor.isActive('table') && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 border-t border-card-border animate-in slide-in-from-top-1 duration-200">
            <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider mr-2">Tabla:</span>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="px-2 py-1 bg-white border border-card-border rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              + Col Izq
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="px-2 py-1 bg-white border border-card-border rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              + Col Der
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="px-2 py-1 bg-red-50 border border-red-100 rounded text-[10px] font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              Eliminar Col
            </button>
            
            <div className="w-px h-3.5 bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="px-2 py-1 bg-white border border-card-border rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              + Fila Arriba
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="px-2 py-1 bg-white border border-card-border rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              + Fila Abajo
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-2 py-1 bg-red-50 border border-red-100 rounded text-[10px] font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              Eliminar Fila
            </button>

            <div className="w-px h-3.5 bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 transition-colors"
            >
              Eliminar Tabla
            </button>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="px-5 py-4 bg-card animate-in fade-in duration-300" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

