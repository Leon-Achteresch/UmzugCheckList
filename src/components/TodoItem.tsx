"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Todo } from "./Checklist";
import {
  Trash2,
  Check,
  Link as LinkIcon,
  Coins,
  ExternalLink,
  Edit,
  Save,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
}

export function TodoItem({
  todo,
  onToggle,
  onRemove,
  onUpdate,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(todo.text);
  const [editedLink, setEditedLink] = useState(todo.link || "");
  const [editedPrice, setEditedPrice] = useState(todo.price || "");

  const handleSave = () => {
    if (editedText.trim() === "") return;

    onUpdate(todo.id, {
      text: editedText,
      link: editedLink.trim() || undefined,
      price: editedPrice.trim() || undefined,
    });

    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(todo.text);
    setEditedLink(todo.link || "");
    setEditedPrice(todo.price || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="group border-b border-gray-100/60 dark:border-gray-800/40 bg-blue-50/50 dark:bg-blue-900/10">
        <td colSpan={5} className="p-3">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                Aufgabe:
              </label>
              <Input
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                placeholder="Aufgabe"
                className="bg-white/70 border-gray-200/70"
                autoFocus
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                Link:
              </label>
              <Input
                value={editedLink}
                onChange={(e) => setEditedLink(e.target.value)}
                placeholder="Link (optional)"
                className="bg-white/70 border-gray-200/70"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                Preis:
              </label>
              <Input
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
                placeholder="Preis (optional)"
                className="bg-white/70 border-gray-200/70"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button onClick={handleCancel} variant="outline" size="sm">
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <Save className="mr-1 h-3.5 w-3.5" />
                Speichern
              </Button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
      <td className="p-2 align-middle" style={{ width: "40px" }}>
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo.id)}
          className="size-5 text-gray-900 dark:text-gray-700 border-gray-300 dark:border-gray-600"
        />
      </td>
      <td className="p-2 align-middle">
        <span
          className={`line-clamp-1 ${
            todo.completed ? "line-through text-gray-500" : ""
          }`}
        >
          {todo.text}
        </span>
      </td>
      <td className="p-2 align-middle">
        {todo.link ? (
          <a
            href={todo.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            <ExternalLink size={14} className="mr-1" />
            Link öffnen
          </a>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>
      <td className="p-2 align-middle">
        {todo.price ? (
          <span className="flex items-center text-sm">
            <Coins size={14} className="mr-1 text-gray-500" />
            {todo.price}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>
      <td className="p-2 align-middle text-right">
        <div className="flex justify-end space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-full p-1.5 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
            aria-label="Aufgabe bearbeiten"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onRemove(todo.id)}
            className="rounded-full p-1.5 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            aria-label="Aufgabe löschen"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
