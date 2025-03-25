"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Edit,
  Check,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Circle,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Category, Todo } from "@/lib/actions";
import { TodoList } from "./TodoList";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface CategoryManagerProps {
  categories: Category[];
  uncategorizedTodos: Todo[];
  onCategoryCreate: (name: string, color?: string) => void;
  onCategoryUpdate: (
    id: string,
    updates: { name?: string; color?: string; position?: number }
  ) => void;
  onCategoryDelete: (id: string) => void;
  onTodoCreate: (text: string, categoryId?: string) => void;
  onTodoUpdate: (id: string, updates: Partial<Todo>) => void;
  onTodoCategoryChange: (todoId: string, categoryId: string | null) => void;
  onTodoDelete: (id: string) => void;
}

// Vordefinierte Kategoriefarben
const CATEGORY_COLORS = [
  "#FF5733", // Rot
  "#33FF57", // Grün
  "#3357FF", // Blau
  "#FF33A8", // Pink
  "#FFD433", // Gelb
  "#8033FF", // Lila
  "#FF8333", // Orange
  "#33FFF8", // Türkis
  "#C6FF33", // Limettengrün
  "#8B4513", // Braun
];

// Hilfsfunktion zum Berechnen der Preissumme
const calculateTotalPrice = (todos: Todo[]): number => {
  return todos.reduce((total, todo) => {
    if (!todo.price) return total;
    const price =
      typeof todo.price === "string"
        ? parseFloat(todo.price.replace(",", "."))
        : todo.price;
    return total + (isNaN(price) ? 0 : price);
  }, 0);
};

// Hilfsfunktion zum Formatieren des Preises
const formatPrice = (price: number): string => {
  return (
    price.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
};

export function CategoryManager({
  categories,
  uncategorizedTodos,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  onTodoCreate,
  onTodoUpdate,
  onTodoCategoryChange,
  onTodoDelete,
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState<string | null>(
    null
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  // Hilfsfunktion zum Zufallsauswählen einer Farbe
  const getRandomColor = () => {
    return CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
  };

  // Kategorie-Erstellung abschließen
  const handleCreateCategory = () => {
    if (newCategoryName.trim() === "") return;

    setIsLoading(true);
    onCategoryCreate(newCategoryName, getRandomColor());
    setNewCategoryName("");
    setIsAddingCategory(false);
    setIsLoading(false);
  };

  // Kategorie-Bearbeitung starten
  const startEditingCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color || null);
  };

  // Kategorie-Bearbeitung abschließen
  const finishEditingCategory = () => {
    if (!editingCategoryId || editCategoryName.trim() === "") return;

    setIsLoading(true);

    onCategoryUpdate(editingCategoryId, {
      name: editCategoryName,
      color: editCategoryColor === null ? undefined : editCategoryColor,
    });

    setEditingCategoryId(null);
    setEditCategoryName("");
    setEditCategoryColor(null);
    setIsLoading(false);
  };

  // Kategorie löschen bestätigen
  const handleDeleteCategory = (id: string) => {
    setConfirmDeleteId(id);
  };

  // Kategorie tatsächlich löschen
  const confirmDeleteCategory = () => {
    if (!confirmDeleteId) return;

    setIsLoading(true);
    onCategoryDelete(confirmDeleteId);
    setConfirmDeleteId(null);
    setIsLoading(false);
  };

  // Kategorie ein-/ausklappen
  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [categoryId]: !expandedCategories[categoryId],
    });
  };

  // Standardmäßig alle Kategorien erweitern, falls nicht anders gesetzt
  const isCategoryExpanded = (categoryId: string) => {
    return expandedCategories[categoryId] !== false; // Standardmäßig erweitert (true)
  };

  // Kategorie-Reihenfolge ändern
  const moveCategory = (categoryId: string, direction: "up" | "down") => {
    const categoryIndex = categories.findIndex((cat) => cat.id === categoryId);
    if (categoryIndex === -1) return;

    if (direction === "up" && categoryIndex > 0) {
      const newPosition = categories[categoryIndex - 1].position;
      onCategoryUpdate(categoryId, { position: newPosition });
    } else if (direction === "down" && categoryIndex < categories.length - 1) {
      const newPosition = categories[categoryIndex + 1].position;
      onCategoryUpdate(categoryId, { position: newPosition });
    }
  };

  const handleTodoDelete = async (id: string) => {
    try {
      await onTodoDelete(id);
      toast.success("Aufgabe wurde erfolgreich gelöscht");
    } catch (error) {
      console.error("Fehler beim Löschen der Aufgabe:", error);
      toast.error("Fehler beim Löschen der Aufgabe");
    }
  };

  return (
    <div className="space-y-6">
      {/* Kategorieliste */}
      {categories.map((category) => (
        <Card key={category.id} className="overflow-hidden">
          <CardHeader
            className={`cursor-pointer px-4 py-2 flex flex-row justify-between items-center`}
            style={{
              backgroundColor: category.color
                ? `${category.color}30`
                : undefined, // 30 = 19% Alpha
              borderLeft: category.color
                ? `4px solid ${category.color}`
                : undefined,
            }}
            onClick={() => toggleCategoryExpand(category.id)}
          >
            <div className="flex items-center space-x-2 flex-grow">
              {editingCategoryId === category.id ? (
                <div
                  className="flex items-center flex-grow"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="h-8 flex-grow"
                    placeholder="Kategoriename..."
                    autoFocus
                  />
                  <div className="flex items-center ml-2">
                    {CATEGORY_COLORS.slice(0, 5).map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditCategoryColor(color)}
                        className={`w-4 h-4 rounded-full mx-0.5 ${
                          editCategoryColor === color
                            ? "ring-2 ring-offset-2 ring-gray-500"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1 ml-1"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="p-2 flex flex-wrap w-32">
                        {CATEGORY_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditCategoryColor(color)}
                            className={`w-6 h-6 rounded-full m-1 ${
                              editCategoryColor === color
                                ? "ring-2 ring-offset-1 ring-gray-500"
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 ml-1"
                      onClick={finishEditingCategory}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setEditingCategoryId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center flex-grow justify-between">
                  <div className="flex items-center flex-wrap gap-2">
                    {category.color && (
                      <Circle
                        fill={category.color}
                        className="h-3.5 w-3.5"
                        stroke="none"
                      />
                    )}
                    <CardTitle className="text-md font-medium">
                      {category.name}
                    </CardTitle>
                    <Badge variant="secondary" className="font-normal">
                      {category.todos.length}
                    </Badge>
                    {category.todos.length > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 flex items-center gap-1"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        {formatPrice(calculateTotalPrice(category.todos))}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingCategory(category);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveCategory(category.id, "up");
                      }}
                      disabled={categories.indexOf(category) === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveCategory(category.id, "down");
                      }}
                      disabled={
                        categories.indexOf(category) === categories.length - 1
                      }
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <AnimatePresence>
            {isCategoryExpanded(category.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-4">
                  <TodoList
                    todos={category.todos}
                    onTodoCreate={(todoData) => {
                      // JSON-String in ein Objekt umwandeln
                      let data;
                      try {
                        data = JSON.parse(todoData);
                        onTodoCreate(data.text, category.id);
                      } catch (e) {
                        // Falls kein gültiger JSON-String, als normalen Text behandeln
                        onTodoCreate(todoData, category.id);
                      }
                    }}
                    onTodoUpdate={onTodoUpdate}
                    onTodoDelete={handleTodoDelete}
                    onTodoCategoryChange={(todoId) =>
                      onTodoCategoryChange(todoId, null)
                    }
                    categoryColor={category.color}
                    availableCategories={categories}
                  />
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      ))}

      {/* Nur die TodoList für nicht zugewiesene Todos anzeigen, wenn es welche gibt */}
      {uncategorizedTodos.length > 0 && (
        <Card>
          <CardHeader className="px-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-md font-medium">
                Ohne Kategorie
              </CardTitle>
              <Badge variant="secondary" className="font-normal">
                {uncategorizedTodos.length}
              </Badge>
              {uncategorizedTodos.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 flex items-center gap-1"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {formatPrice(calculateTotalPrice(uncategorizedTodos))}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <TodoList
              todos={uncategorizedTodos}
              onTodoCreate={(todoData) => {
                // JSON-String in ein Objekt umwandeln
                let data;
                try {
                  data = JSON.parse(todoData);
                  onTodoCreate(data.text);
                } catch (e) {
                  // Falls kein gültiger JSON-String, als normalen Text behandeln
                  onTodoCreate(todoData);
                }
              }}
              onTodoUpdate={onTodoUpdate}
              onTodoDelete={handleTodoDelete}
              onTodoCategoryChange={(todoId) => {
                if (categories.length > 0) {
                  onTodoCategoryChange(todoId, categories[0].id);
                }
              }}
              availableCategories={categories}
            />
          </CardContent>
        </Card>
      )}

      {/* Neue Kategorie hinzufügen */}
      {isAddingCategory ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center"
        >
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Neue Kategorie..."
            className="flex-grow"
            onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
            autoFocus
          />
          <Button
            onClick={handleCreateCategory}
            className="ml-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Erstellen
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsAddingCategory(false)}
            className="ml-1"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      ) : (
        <Button
          onClick={() => setIsAddingCategory(true)}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Neue Kategorie
        </Button>
      )}

      {/* Löschen-Bestätigungsdialog */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kategorie löschen</DialogTitle>
            <DialogDescription>
              Bist du sicher, dass du diese Kategorie löschen möchtest? Alle
              enthaltenen Aufgaben werden ohne Kategorie bleiben.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end space-x-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteCategory}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
