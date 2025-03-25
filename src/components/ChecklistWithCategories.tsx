"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PencilIcon, Save, XIcon } from "lucide-react";
import { CategoryManager } from "./CategoryManager";
import { Todo, Category } from "@/lib/actions";

export interface ChecklistWithCategoriesData {
  id: string;
  title: string;
  categories: Category[];
  uncategorizedTodos: Todo[];
  project_id: string;
}

interface ChecklistWithCategoriesProps {
  checklist: ChecklistWithCategoriesData;
  onUpdate: (updatedChecklist: ChecklistWithCategoriesData) => void;
}

export function ChecklistWithCategories({
  checklist,
  onUpdate,
}: ChecklistWithCategoriesProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(checklist.title);

  // Titel bearbeiten beenden
  const handleTitleSave = () => {
    onUpdate({
      ...checklist,
      title: title.trim() || checklist.title,
    });
    setEditingTitle(false);
  };

  // Kategorie erstellen
  const handleCategoryCreate = (name: string, color?: string) => {
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name,
      color,
      position: checklist.categories.length,
      todos: [],
    };

    onUpdate({
      ...checklist,
      categories: [...checklist.categories, newCategory],
    });
  };

  // Kategorie aktualisieren
  const handleCategoryUpdate = (
    id: string,
    updates: { name?: string; color?: string; position?: number }
  ) => {
    const updatedCategories = checklist.categories.map((category) =>
      category.id === id ? { ...category, ...updates } : category
    );

    // Nach Position sortieren
    updatedCategories.sort((a, b) => a.position - b.position);

    onUpdate({
      ...checklist,
      categories: updatedCategories,
    });
  };

  // Kategorie löschen
  const handleCategoryDelete = (id: string) => {
    // Todos aus der gelöschten Kategorie zu den unkategorisierten Todos hinzufügen
    const categoryToDelete = checklist.categories.find((cat) => cat.id === id);
    let newUncategorizedTodos = [...checklist.uncategorizedTodos];

    if (categoryToDelete) {
      newUncategorizedTodos = [
        ...newUncategorizedTodos,
        ...categoryToDelete.todos,
      ];
    }

    onUpdate({
      ...checklist,
      categories: checklist.categories.filter((category) => category.id !== id),
      uncategorizedTodos: newUncategorizedTodos,
    });
  };

  // Todo erstellen
  const handleTodoCreate = (text: string, categoryId?: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      position: getTodoPosition(categoryId),
    };

    if (categoryId) {
      // Todo zu einer bestimmten Kategorie hinzufügen
      onUpdate({
        ...checklist,
        categories: checklist.categories.map((category) =>
          category.id === categoryId
            ? { ...category, todos: [...category.todos, newTodo] }
            : category
        ),
      });
    } else {
      // Todo ohne Kategorie hinzufügen
      onUpdate({
        ...checklist,
        uncategorizedTodos: [...checklist.uncategorizedTodos, newTodo],
      });
    }
  };

  // Todo aktualisieren
  const handleTodoUpdate = (id: string, updates: Partial<Todo>) => {
    // Prüfen, ob das Todo in einer Kategorie ist
    let categoryWithTodo = checklist.categories.find((category) =>
      category.todos.some((todo) => todo.id === id)
    );

    if (categoryWithTodo) {
      // Todo in einer Kategorie aktualisieren
      onUpdate({
        ...checklist,
        categories: checklist.categories.map((category) =>
          category.id === categoryWithTodo!.id
            ? {
                ...category,
                todos: category.todos.map((todo) =>
                  todo.id === id ? { ...todo, ...updates } : todo
                ),
              }
            : category
        ),
      });
    } else {
      // Todo ohne Kategorie aktualisieren
      onUpdate({
        ...checklist,
        uncategorizedTodos: checklist.uncategorizedTodos.map((todo) =>
          todo.id === id ? { ...todo, ...updates } : todo
        ),
      });
    }
  };

  // Todo löschen
  const handleTodoDelete = (id: string) => {
    // Prüfen, ob das Todo in einer Kategorie ist
    let categoryWithTodo = checklist.categories.find((category) =>
      category.todos.some((todo) => todo.id === id)
    );

    if (categoryWithTodo) {
      // Todo aus einer Kategorie löschen
      onUpdate({
        ...checklist,
        categories: checklist.categories.map((category) =>
          category.id === categoryWithTodo!.id
            ? {
                ...category,
                todos: category.todos.filter((todo) => todo.id !== id),
              }
            : category
        ),
      });
    } else {
      // Todo ohne Kategorie löschen
      onUpdate({
        ...checklist,
        uncategorizedTodos: checklist.uncategorizedTodos.filter(
          (todo) => todo.id !== id
        ),
      });
    }
  };

  // Todo Kategorie ändern
  const handleTodoCategoryChange = (
    todoId: string,
    newCategoryId: string | null
  ) => {
    // Todo finden
    let todoToMove: Todo | undefined;
    let sourceCategory: Category | undefined;

    // Prüfen, ob das Todo in einer Kategorie ist
    for (const category of checklist.categories) {
      const foundTodo = category.todos.find((todo) => todo.id === todoId);
      if (foundTodo) {
        todoToMove = foundTodo;
        sourceCategory = category;
        break;
      }
    }

    // Falls nicht in einer Kategorie, bei den unkategorisierten Todos suchen
    if (!todoToMove) {
      todoToMove = checklist.uncategorizedTodos.find(
        (todo) => todo.id === todoId
      );
    }

    if (!todoToMove) return; // Todo nicht gefunden

    let updatedCategories = [...checklist.categories];
    let updatedUncategorizedTodos = [...checklist.uncategorizedTodos];

    // Todo aus der Quelle entfernen
    if (sourceCategory) {
      // Aus einer Kategorie entfernen
      updatedCategories = updatedCategories.map((category) =>
        category.id === sourceCategory!.id
          ? {
              ...category,
              todos: category.todos.filter((todo) => todo.id !== todoId),
            }
          : category
      );
    } else {
      // Aus den unkategorisierten Todos entfernen
      updatedUncategorizedTodos = updatedUncategorizedTodos.filter(
        (todo) => todo.id !== todoId
      );
    }

    // Todo zum Ziel hinzufügen
    if (newCategoryId) {
      // Zu einer Kategorie hinzufügen
      updatedCategories = updatedCategories.map((category) =>
        category.id === newCategoryId
          ? {
              ...category,
              todos: [
                ...category.todos,
                { ...todoToMove!, position: category.todos.length },
              ],
            }
          : category
      );
    } else {
      // Zu den unkategorisierten Todos hinzufügen
      updatedUncategorizedTodos = [
        ...updatedUncategorizedTodos,
        { ...todoToMove, position: updatedUncategorizedTodos.length },
      ];
    }

    onUpdate({
      ...checklist,
      categories: updatedCategories,
      uncategorizedTodos: updatedUncategorizedTodos,
    });
  };

  // Hilfsfunktion: Position für ein neues Todo bestimmen
  const getTodoPosition = (categoryId?: string): number => {
    if (categoryId) {
      const category = checklist.categories.find(
        (cat) => cat.id === categoryId
      );
      return category ? category.todos.length : 0;
    } else {
      return checklist.uncategorizedTodos.length;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        {editingTitle ? (
          <div className="flex items-center w-full">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-grow"
              placeholder="Checklisten-Titel..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
            />
            <div className="flex ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTitleSave}
                className="h-9 w-9 p-0"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTitle(checklist.title);
                  setEditingTitle(false);
                }}
                className="h-9 w-9 p-0"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-between items-center">
            <h2 className="text-lg font-medium">{checklist.title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingTitle(true)}
              className="h-8 w-8 p-0"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="p-4">
        <CategoryManager
          categories={checklist.categories}
          uncategorizedTodos={checklist.uncategorizedTodos}
          onCategoryCreate={handleCategoryCreate}
          onCategoryUpdate={handleCategoryUpdate}
          onCategoryDelete={handleCategoryDelete}
          onTodoCreate={handleTodoCreate}
          onTodoUpdate={handleTodoUpdate}
          onTodoCategoryChange={handleTodoCategoryChange}
          onTodoDelete={handleTodoDelete}
        />
      </div>
    </div>
  );
}
