
"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";

interface TagInputProps {
    tags: string[];
    setTags: (tags: string[]) => void;
}

export function TagInput({ tags, setTags }: TagInputProps) {
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch suggestions as user types
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (input.length < 2) {
                setSuggestions([]);
                return;
            }
            try {
                const res = await fetch(`/api/dept/tags?query=${input}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.filter((tag: any) => !tags.includes(tag.name)));
                }
            } catch (e) {
                console.error("Failed to fetch tag suggestions", e);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [input, tags]);

    function addTag(tag: string) {
        if (!tags.includes(tag) && tag.trim()) {
            setTags([...tags, tag.trim()]);
            setInput("");
            setSuggestions([]);
        }
    }

    function removeTag(tagToRemove: string) {
        setTags(tags.filter(tag => tag !== tagToRemove));
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && input) {
            e.preventDefault();
            addTag(input);
        } else if (e.key === "Backspace" && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    }

    return (
        <div className="relative">
            <div className={`flex flex-wrap items-center gap-2 p-2 border rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white ${isFocused ? 'ring-2 ring-indigo-500' : ''}`}>
                {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-md animate-in fade-in zoom-in duration-200">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-indigo-400 hover:text-indigo-900 bg-indigo-100 rounded-full p-0.5 transition-colors">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder={tags.length === 0 ? "Add tags (e.g., Exam, Urgent)..." : ""}
                    className="flex-1 outline-none min-w-[120px] text-sm py-1"
                />
            </div>

            {/* Suggestions Dropdown */}
            {(suggestions.length > 0 || (input.length >= 2 && !suggestions.find(s => s.name === input))) && isFocused && (
                <div ref={dropdownRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map(suggestion => (
                        <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => addTag(suggestion.name)}
                            className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm flex items-center justify-between group"
                        >
                            <span>{suggestion.name}</span>
                            <span className="text-xs text-gray-400 group-hover:text-indigo-400">Add</span>
                        </button>
                    ))}
                    {input && !suggestions.find(s => s.name === input) && (
                        <button
                            type="button"
                            onClick={() => addTag(input)}
                            className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm text-indigo-600 font-medium border-t border-gray-100"
                        >
                            Create new tag: "{input}"
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
