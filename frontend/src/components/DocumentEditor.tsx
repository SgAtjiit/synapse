import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { ResizableImage } from '@/extensions/ResizableImage';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize } from '@/extensions/FontSize';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  FileText, Save, Users, Sparkles, Bold, Italic, List, ListOrdered,
  Download, ChevronDown, FileType, Image as ImageIcon, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, Type, Palette, Trash2, Move
} from 'lucide-react';
import { PresenceUser } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface DocumentEditorProps {
  content: string;
  users: PresenceUser[];
  currentUser: string;
  onContentChange: (content: string) => void;
  onAiFormat: (content: string) => void;
}

export function DocumentEditor({ content, users, currentUser, onContentChange, onAiFormat }: DocumentEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [imageWidth, setImageWidth] = useState('');
  const [imageHeight, setImageHeight] = useState('');
  const [isImageSelected, setIsImageSelected] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing your document here...',
      }),
      Typography,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      ResizableImage,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none max-w-none dark:prose-invert',
      },
    },
    onUpdate: ({ editor }) => {
      setIsSaving(true);
      const html = editor.getHTML();
      onContentChange(html);

      // Simulate save delay
      setTimeout(() => setIsSaving(false), 500);
    },
    onSelectionUpdate: ({ editor }) => {
      setIsImageSelected(editor.isActive('image'));
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (Math.abs(editor.getHTML().length - content.length) > 5 || editor.isEmpty) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  const handleDownloadDOCX = async () => {
    if (!editor) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          ${editor.getHTML()}
        </body>
      </html>
    `;

    try {
      const blob = await asBlob(htmlContent);
      saveAs(blob as Blob, 'document.docx');
    } catch (error) {
      console.error('Error generating DOCX:', error);
    }
  };

  const handleDownloadPDF = () => {
    if (!editor) return;

    const element = document.createElement('div');
    element.innerHTML = editor.getHTML();

    // Apply print styles
    element.style.padding = '40px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.color = '#000000';
    element.style.backgroundColor = '#ffffff';
    element.style.fontSize = '12pt';
    element.style.lineHeight = '1.5';

    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((h) => {
      (h as HTMLElement).style.color = '#000000';
    });

    const opt = {
      margin: [0.5, 0.5],
      filename: 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          editor.chain().focus().setImage({ src: result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const applyImageSize = () => {
    if (!editor) return;
    const attrs: { width?: string; height?: string } = {};
    if (imageWidth) attrs.width = imageWidth;
    if (imageHeight) attrs.height = imageHeight;
    editor.chain().focus().updateAttributes('image', attrs).run();
  };

  const otherUsers = users.filter(u => u.username !== currentUser);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Shared Document</h2>
            <p className="text-xs text-muted-foreground">
              {editor.storage.characterCount?.words?.() || 0} words
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toolbar */}
          <div className="flex items-center gap-1 mr-4 border-r border-border pr-4 flex-wrap">
            {/* Basic Formatting */}
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-secondary' : ''}>
              <Bold className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-secondary' : ''}>
              <Italic className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Alignment */}
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'bg-secondary' : ''}>
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'bg-secondary' : ''}>
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'bg-secondary' : ''}>
              <AlignRight className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Lists */}
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-secondary' : ''}>
              <List className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-secondary' : ''}>
              <ListOrdered className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Fonts & Colors */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Font Family">
                  <Type className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Inter').run()}>Inter</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Comic Sans MS, Comic Sans').run()}>Comic Sans</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('serif').run()}>Serif</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('monospace').run()}>Monospace</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().unsetFontFamily().run()}>Default</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-12 px-0">
                  <span className="text-xs">Size</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[12, 14, 16, 18, 20, 24, 30].map(size => (
                  <DropdownMenuItem key={size} onClick={() => editor.chain().focus().setFontSize(`${size}px`).run()}>
                    {size}px
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => editor.chain().focus().unsetFontSize().run()}>Default</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative flex items-center justify-center w-8 h-8">
              <input
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                value={editor.getAttributes('textStyle').color || '#000000'}
                title="Text Color"
              />
              <Palette className="w-4 h-4 pointer-events-none" />
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Insert Image */}
            <Button variant="ghost" size="icon" onClick={addImage} title="Insert Image">
              <ImageIcon className="w-4 h-4" />
            </Button>

            {/* Image Resize Controls - Only visible when image is selected */}
            {isImageSelected && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" title="Image Options" className="bg-primary/10">
                    <Move className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Image Options</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => editor.chain().focus().deleteSelection().run()}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Alignment</Label>
                      <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-md">
                        <Button variant="ghost" size="sm" className="flex-1 h-7" onClick={() => editor.chain().focus().updateAttributes('image', { style: 'float: left; margin-right: 1rem;' }).run()}>
                          <AlignLeft className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 h-7" onClick={() => editor.chain().focus().updateAttributes('image', { style: 'display: block; margin: 0 auto;' }).run()}>
                          <AlignCenter className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 h-7" onClick={() => editor.chain().focus().updateAttributes('image', { style: 'float: right; margin-left: 1rem;' }).run()}>
                          <AlignRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Quick Resize</Label>
                      <div className="grid grid-cols-4 gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => editor.chain().focus().updateAttributes('image', { width: '25%', height: 'auto' }).run()}>25%</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => editor.chain().focus().updateAttributes('image', { width: '50%', height: 'auto' }).run()}>50%</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => editor.chain().focus().updateAttributes('image', { width: '75%', height: 'auto' }).run()}>75%</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => editor.chain().focus().updateAttributes('image', { width: '100%', height: 'auto' }).run()}>100%</Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Custom Size</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Width</Label>
                          <Input
                            className="h-7 text-xs"
                            placeholder="e.g. 300px"
                            value={imageWidth}
                            onChange={(e) => setImageWidth(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Height</Label>
                          <Input
                            className="h-7 text-xs"
                            placeholder="e.g. 200px"
                            value={imageHeight}
                            onChange={(e) => setImageHeight(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button size="sm" className="w-full h-7 text-xs" onClick={applyImageSize}>Apply Size</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Table */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Table">
                  <TableIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                  Insert Table (3x3)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>Add Column</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>Delete Column</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>Add Row</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>Delete Row</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Table
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Download
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadDOCX}>
                <FileText className="w-4 h-4 mr-2" />
                Word Document (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <FileType className="w-4 h-4 mr-2" />
                PDF Document (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-primary hover:text-primary"
            onClick={() => onAiFormat(editor.getHTML())}
          >
            <Sparkles className="w-4 h-4" />
            Format with AI
          </Button>

          {/* Save indicator */}
          <div className={cn(
            "flex items-center gap-1.5 text-xs transition-opacity duration-200",
            isSaving ? "opacity-100" : "opacity-0"
          )}>
            <Save className="w-3 h-3 text-synapse-warning animate-pulse" />
            <span className="text-muted-foreground">Saving...</span>
          </div>

          {/* Collaborators */}
          {otherUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {otherUsers.slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: user.color }}
                    title={user.username}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
          <span>
            {otherUsers.length > 0
              ? `Collaborating with ${otherUsers.map(u => u.username).join(', ')}`
              : 'You are the only editor'
            }
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-synapse-success" />
            Auto-save enabled
          </span>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </div>
  );
}
