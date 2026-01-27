import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface AutoCompleteOptions {
    suggestion: string;
    onAccept: () => void;
}

export interface AutoCompleteStorage {
    suggestion: string;
}

export const AutoComplete = Extension.create<AutoCompleteOptions, AutoCompleteStorage>({
    name: 'autoComplete',

    addOptions() {
        return {
            suggestion: '',
            onAccept: () => { },
        };
    },

    addStorage() {
        return {
            suggestion: '',
        };
    },

    addKeyboardShortcuts() {
        return {
            Tab: () => {
                if (this.storage.suggestion) {
                    // Insert the suggestion
                    this.editor.commands.insertContent(this.storage.suggestion);
                    // Clear the suggestion
                    this.storage.suggestion = '';
                    this.options.onAccept();
                    return true;
                }
                return false;
            },
            Escape: () => {
                if (this.storage.suggestion) {
                    this.storage.suggestion = '';
                    return true;
                }
                return false;
            },
        };
    },

    addProseMirrorPlugins() {
        const extension = this;

        return [
            new Plugin({
                key: new PluginKey('autoComplete'),
                props: {
                    decorations: (state) => {
                        const suggestion = extension.storage.suggestion;
                        if (!suggestion) return DecorationSet.empty;

                        const { selection } = state;
                        const { $head } = selection;

                        // Create a widget decoration at cursor position
                        const widget = Decoration.widget($head.pos, () => {
                            const span = document.createElement('span');
                            span.className = 'autocomplete-suggestion';
                            span.textContent = suggestion;
                            span.style.opacity = '0.4';
                            span.style.color = 'currentColor';
                            span.style.pointerEvents = 'none';
                            return span;
                        });

                        return DecorationSet.create(state.doc, [widget]);
                    },
                },
            }),
        ];
    },
});
