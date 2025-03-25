"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, X, Edit, Check, Trash2, Tag, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Todo, Category } from "@/lib/actions";

interface TodoListProps {
  todos: Todo[];
  onTodoCreate: (text: string) => void;
  onTodoUpdate: (id: string, updates: Partial<Todo>) => void;
  onTodoDelete: (id: string) => void;
  onTodoCategoryChange?: (todoId: string) => void;
  categoryColor?: string;
  availableCategories?: Category[]; // Liste aller verfügbaren Kategorien
}

export function TodoList({
  todos,
  onTodoCreate,
  onTodoUpdate,
  onTodoDelete,
  onTodoCategoryChange,
  categoryColor,
  availableCategories = [],
}: TodoListProps) {
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPrice, setNewTodoPrice] = useState("");
  const [newTodoLink, setNewTodoLink] = useState("");
  const [isAddingDetails, setIsAddingDetails] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [pendingTodoData, setPendingTodoData] = useState<any>(null);
  const newTodoInputRef = useRef<HTMLInputElement>(null);
  const editTextInputRef = useRef<HTMLInputElement>(null);

  // Fokus auf Eingabefeld bei Bearbeitung
  useEffect(() => {
    if (editingTodoId && editTextInputRef.current) {
      editTextInputRef.current.focus();
    }
  }, [editingTodoId]);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const formatPrice = (price: string | number) => {
    // Preis formatieren (z.B. "10" -> "10,00 €")
    if (!price) return "";

    const numericPrice =
      typeof price === "string" ? parseFloat(price.replace(",", ".")) : price;

    if (isNaN(numericPrice)) return String(price);

    return (
      numericPrice.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " €"
    );
  };

  // Neues Todo erstellen
  const handleCreateTodo = (categoryId?: string) => {
    if (!newTodoText.trim()) return;

    // Erstelle ein Basisobjekt für das neue Todo
    const todoData = {
      text: newTodoText,
      // Füge Preis und Link hinzu, wenn sie vorhanden sind
      price: newTodoPrice.trim() || undefined,
      link: newTodoLink.trim() || undefined,
      ...(categoryId && { category_id: categoryId }),
    };

    // Wenn keine spezifische Kategorie angegeben ist und wir in keiner Kategorie sind
    if (!categoryId && !categoryColor && availableCategories.length > 0) {
      setPendingTodoData(todoData);
      setShowCategoryDialog(true);
      return;
    }

    // Wandle das Objekt in einen JSON-String um, der an die onTodoCreate-Funktion übergeben wird
    onTodoCreate(JSON.stringify(todoData));

    // Zurücksetzen der Eingabefelder
    setNewTodoText("");
    setNewTodoPrice("");
    setNewTodoLink("");
    setIsAddingDetails(false);

    // Fokus auf das Eingabefeld für ein neues Todo setzen
    setTimeout(() => {
      newTodoInputRef.current?.focus();
    }, 0);
  };

  // Todo mit ausgewählter Kategorie erstellen
  const createTodoWithCategory = (categoryId: string) => {
    if (!pendingTodoData) return;

    const todoData = {
      ...pendingTodoData,
      category_id: categoryId,
    };

    // Aufgabe erstellen
    onTodoCreate(JSON.stringify(todoData));

    // Dialog schließen und Daten zurücksetzen
    setShowCategoryDialog(false);
    setPendingTodoData(null);

    // Eingabefelder zurücksetzen
    setNewTodoText("");
    setNewTodoPrice("");
    setNewTodoLink("");
    setIsAddingDetails(false);
  };

  // Bearbeitung eines Todos starten
  const startEditingTodo = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditText(todo.text);
    setEditPrice(todo.price ? String(todo.price) : "");
    setEditLink(todo.link || "");
    setEditNotes(todo.notes || "");
  };

  // Bearbeitung eines Todos abschließen
  const finishEditingTodo = () => {
    if (!editingTodoId || !editText.trim()) return;

    onTodoUpdate(editingTodoId, {
      text: editText,
      price: editPrice || undefined,
      link: editLink || undefined,
      notes: editNotes || undefined,
    });

    setEditingTodoId(null);
    setEditText("");
    setEditPrice("");
    setEditLink("");
    setEditNotes("");
  };

  // Status eines Todos umschalten
  const toggleTodoCompleted = (id: string, completed: boolean) => {
    onTodoUpdate(id, { completed: !completed });
  };

  return (
    <div className="space-y-3">
      {/* Todoliste */}
      <div className="space-y-2">
        {todos.map((todo) => (
          <motion.div
            key={todo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`group flex items-start p-2 rounded-md ${
              todo.completed
                ? "bg-gray-50 dark:bg-gray-800/20"
                : "bg-white dark:bg-gray-800"
            } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-gray-100 dark:border-gray-700/50`}
            style={{
              borderLeftColor: categoryColor || undefined,
              borderLeftWidth: categoryColor ? "3px" : undefined,
            }}
          >
            {editingTodoId === todo.id ? (
              // Bearbeitungsmodus
              <div className="w-full space-y-2">
                <div className="flex items-center">
                  <Input
                    ref={editTextInputRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Aufgabe..."
                    className="flex-grow"
                  />
                  <div className="flex ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={finishEditingTodo}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setEditingTodoId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-grow">
                    <Input
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="Preis (z.B. 9,99)"
                      className="w-full mb-2"
                    />
                    <Input
                      value={editLink}
                      onChange={(e) => setEditLink(e.target.value)}
                      placeholder="Link (https://...)"
                      className="w-full"
                    />
                  </div>

                  <div className="flex-grow">
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notizen..."
                      className="w-full h-[86px] resize-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Anzeigemodus
              <div className="flex w-full">
                <div className="flex-shrink-0 mr-2 mt-1">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() =>
                      toggleTodoCompleted(todo.id, todo.completed)
                    }
                  />
                </div>
                <div className="flex-grow">
                  <div
                    className={`text-sm ${
                      todo.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {todo.text}
                  </div>

                  {/* Zusätzliche Todo-Details */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {todo.link && (
                      <a
                        href={
                          isValidUrl(todo.link)
                            ? todo.link
                            : `https://${todo.link}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Badge
                          variant="outline"
                          className="gap-1 border-blue-200"
                        >
                          <span>🔗</span> Link
                        </Badge>
                      </a>
                    )}

                    {todo.price && (
                      <Badge
                        variant="outline"
                        className="text-xs gap-1 border-green-200"
                      >
                        <CreditCard className="h-3 w-3" />{" "}
                        {formatPrice(todo.price)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-start ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onTodoCategoryChange && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onTodoCategoryChange(todo.id)}
                    >
                      <Tag className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => startEditingTodo(todo)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500"
                    onClick={() => onTodoDelete(todo.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Neue Aufgabe hinzufügen */}
      <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700/50 p-2 space-y-2">
        <div className="flex items-center">
          <Input
            ref={newTodoInputRef}
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Neue Aufgabe..."
            className="flex-grow"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                if (isAddingDetails) {
                  handleCreateTodo();
                } else {
                  setIsAddingDetails(true);
                }
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => setIsAddingDetails(!isAddingDetails)}
          >
            {isAddingDetails ? (
              <X className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isAddingDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2"
          >
            <Input
              value={newTodoPrice}
              onChange={(e) => setNewTodoPrice(e.target.value)}
              placeholder="Preis (z.B. 9,99)"
              className="flex-1"
            />
            <Input
              value={newTodoLink}
              onChange={(e) => setNewTodoLink(e.target.value)}
              placeholder="Link (https://...)"
              className="flex-1"
            />
            <Button onClick={() => handleCreateTodo()}>
              <Plus className="h-4 w-4 mr-1" />
              Hinzufügen
            </Button>
          </motion.div>
        )}
      </div>

      {/* Dialog zur Kategorieauswahl */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kategorie auswählen</DialogTitle>
            <DialogDescription>
              Wähle eine Kategorie für die neue Aufgabe aus.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {availableCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderLeft: category.color
                    ? `4px solid ${category.color}`
                    : undefined,
                }}
                onClick={() => createTodoWithCategory(category.id)}
              >
                {category.color && (
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                <span>{category.name}</span>
                <span className="text-gray-500 text-sm ml-2">
                  ({category.todos.length})
                </span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryDialog(false);
                setPendingTodoData(null);
              }}
            >
              Abbrechen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
