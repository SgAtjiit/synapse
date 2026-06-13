import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export const ResizableImage = Image.extend({
    name: 'image',

    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: 'auto',
                renderHTML: attributes => {
                    return {
                        width: attributes.width,
                    };
                },
            },
            height: {
                default: 'auto',
                renderHTML: attributes => {
                    return {
                        height: attributes.height,
                    };
                },
            },
            style: {
                default: null,
                renderHTML: attributes => {
                    return {
                        style: attributes.style,
                    };
                },
            },
        };
    },
});
