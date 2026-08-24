import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { ResizableImage } from './ResizableImageExtension';
import { toast } from 'react-hot-toast';
import { subirArchivoOva } from '../lib/supabase';
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
    className={`p-1.5 rounded-lg transition-all duration-200 border border-transparent cursor-pointer ${
      active
        ? 'bg-blue-50 text-[#15326C] dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/50'
        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
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
          class: 'text-[#15326C] dark:text-blue-400 underline hover:text-blue-600 transition-colors',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-4 font-mono text-xs my-4 overflow-x-auto',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      ResizableImage,
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
        class: 'prose prose-slate prose-sm dark:prose-invert max-w-none focus:outline-none min-h-full leading-relaxed',
      },
    },
  });

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
      editor.chain().focus().setImage({ src: url, alt: file.name, width: '50%', alignment: 'center' }).run();
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
    <div className={`rounded-2xl border border-card-border bg-card overflow-hidden transition-all focus-within:border-[#15326C]/50 dark:focus-within:border-blue-500/50 shadow-sm ${className}`}>
      {/* Selector de archivo oculto para cargar imágenes */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Contenedor de la barra de herramientas */}
      <div className="flex flex-col border-b border-card-border bg-slate-50/70 dark:bg-slate-900/60">
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
            title="Lista con viñetas"
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
            title="Cita destacada"
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
            <ImageIcon className="w-3.5 h-3.5 text-[#15326C] dark:text-blue-400" />
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

        {/* Subbarra dinámica con controles para la tabla activa */}
        {editor.isActive('table') && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 dark:bg-blue-950/40 border-t border-card-border animate-in slide-in-from-top-1 duration-200">
            <span className="text-[10px] font-bold text-[#15326C] dark:text-blue-300 uppercase tracking-wider mr-2">Tabla:</span>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-card-border rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              + Col Izq
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-card-border rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              + Col Der
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="px-2 py-1 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 rounded text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
            >
              Eliminar Col
            </button>
            
            <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-card-border rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              + Fila Arriba
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-card-border rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              + Fila Abajo
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-2 py-1 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 rounded text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
            >
              Eliminar Fila
            </button>

            <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
            >
              Eliminar Tabla
            </button>
          </div>
        )}
      </div>

      {/* Contenido del editor */}
      <div className="px-5 py-4 bg-card animate-in fade-in duration-300" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
