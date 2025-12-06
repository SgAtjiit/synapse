import { Plus, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Document {
    id: string;
    title: string;
    lastModified?: Date;
}

interface DocumentListProps {
    documents: Document[];
    activeDocumentId: string;
    onSelect: (id: string) => void;
    onCreate: () => void;
    onDelete: (id: string) => void;
}

export function DocumentList({ documents, activeDocumentId, onSelect, onCreate, onDelete }: DocumentListProps) {
    return (
        <div className="w-full border-r border-border bg-card/30 flex flex-col h-full">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">Documents</h3>
                <Button variant="ghost" size="icon" onClick={onCreate} className="h-8 w-8">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className={cn(
                                "flex items-center justify-between p-2 rounded-lg cursor-pointer group transition-colors",
                                activeDocumentId === doc.id ? "bg-primary/10 text-primary" : "hover:bg-secondary/50"
                            )}
                            onClick={() => onSelect(doc.id)}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm truncate">{doc.title}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(doc.id);
                                }}
                            >
                                <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
