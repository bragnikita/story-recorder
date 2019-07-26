

export type DictionaryItem = {
    value: string,
    label: string,
}
export type Dictionary = {
    name: string,
    title: string,
    items: DictionaryItem[]
    default: DictionaryItem,
}

export const CategoryTypes: Dictionary = {
    items: [
        { value: "general", label: "General"},
        { value: "story", label: "Story"},
        { value: "chapter", label: "Chapter"},
        { value: "episode", label: "Episode"},
        { value: "Battle", label: "Battle"},
    ],
    get default() {
        return this.items[0]
    },
    name: "category.types", title: "Category types"
};

export const StoryTypes: Dictionary = {
    items: [
        { value: "main", label: "Main Story"},
        { value: "another", label: "Another Story"},
        { value: "character", label: "Character Story"},
        { value: "event", label: "Event Story"},
        { value: "costume", label: "Costume Story"},
    ],
    get default() {
        return this.items[0]
    },
    name: "story.types", title: "Story types"
};

