"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Plus,
  X,
  CheckCircle,
  ListTodo,
  Sparkles,
  Link as LinkIcon,
  Coins,
  CreditCard,
  TrendingUp,
  Trash,
} from "lucide-react";
import { TodoItem } from "./TodoItem";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  link?: string;
  price?: string;
  notes?: string;
  category_id?: string;
  position: number;
}

export interface ChecklistData {
  id: string;
  title: string;
  todos: Todo[];
  project_id: string;
}

interface ChecklistProps {
  checklist: ChecklistData;
  onUpdate: (updatedChecklist: ChecklistData) => void;
}

export function Checklist({ checklist, onUpdate }: ChecklistProps) {
  const [newTodo, setNewTodo] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Berechne die Gesamtsumme aller Preise von nicht erledigten Aufgaben
  const totalPrice = useMemo(() => {
    return checklist.todos.reduce((total, todo) => {
      // Nur nicht erledigte Aufgaben berücksichtigen
      if (todo.completed || !todo.price) return total;

      // Entferne alle nicht-numerischen Zeichen außer Punkt und Komma
      const cleanPrice = todo.price.replace(/[^\d.,]/g, "");
      // Ersetze Komma durch Punkt für die Berechnung
      const normalizedPrice = cleanPrice.replace(",", ".");
      const priceValue = parseFloat(normalizedPrice);

      if (!isNaN(priceValue)) {
        return total + priceValue;
      }

      return total;
    }, 0);
  }, [checklist.todos]);

  // Formatiere den Preis in Euro
  const formattedTotalPrice = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(totalPrice);

  // Zähle nicht erledigte Items mit Preisen
  const activeItemsWithPriceCount = checklist.todos.filter(
    (todo) => !todo.completed && todo.price && todo.price.trim() !== ""
  ).length;

  const addTodo = () => {
    if (newTodo.trim() === "") return;

    setIsLoading(true);

    // Simuliere eine kleine Verzögerung für die Animation
    setTimeout(() => {
      const updatedTodos = [
        ...checklist.todos,
        {
          id: crypto.randomUUID(),
          text: newTodo,
          completed: false,
          link: newLink.trim() || undefined,
          price: newPrice.trim() || undefined,
          position: checklist.todos.length,
        },
      ];
      onUpdate({ ...checklist, todos: updatedTodos });
      setNewTodo("");
      setNewLink("");
      setNewPrice("");
      setShowAdditionalFields(false);
      setIsLoading(false);
    }, 300);
  };

  const toggleTodo = (id: string) => {
    const updatedTodos = checklist.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    onUpdate({ ...checklist, todos: updatedTodos });
  };

  const removeTodo = (id: string) => {
    const updatedTodos = checklist.todos.filter((todo) => todo.id !== id);
    onUpdate({ ...checklist, todos: updatedTodos });
  };

  const updateTodoDetails = (id: string, updates: Partial<Todo>) => {
    const updatedTodos = checklist.todos.map((todo) =>
      todo.id === id ? { ...todo, ...updates } : todo
    );
    onUpdate({ ...checklist, todos: updatedTodos });
  };

  const clearCompleted = () => {
    const updatedTodos = checklist.todos.filter((todo) => !todo.completed);
    onUpdate({ ...checklist, todos: updatedTodos });
  };

  const completedCount = checklist.todos.filter(
    (todo) => todo.completed
  ).length;

  // Zähle alle Items mit Preisen (für Anzeige-Entscheidung)
  const itemsWithPriceCount = checklist.todos.filter(
    (todo) => todo.price && todo.price.trim() !== ""
  ).length;

  return (
    <Card className="w-full overflow-hidden backdrop-blur-md bg-white/80 dark:bg-gray-800/20 border-gray-200/60 dark:border-gray-800/40">
      <CardHeader className="pb-0 px-5 md:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-medium md:text-2xl flex items-center">
            <ListTodo className="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
            {checklist.title}
          </CardTitle>
          <div className="flex items-center space-x-3">
            {activeItemsWithPriceCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center rounded-lg bg-blue-50/80 px-3 py-1.5 text-sm text-blue-800 backdrop-blur-sm dark:bg-blue-900/30 dark:text-blue-300"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span className="font-semibold">{formattedTotalPrice}</span>
              </motion.div>
            )}
            {completedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2"
              >
                <span className="rounded-full bg-emerald-100/80 px-2.5 py-1 text-xs font-medium text-emerald-800 backdrop-blur-sm dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {completedCount} erledigt
                </span>
                <button
                  onClick={clearCompleted}
                  className="flex items-center rounded-full bg-red-50/80 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <Trash className="mr-1 h-3 w-3" />
                  Löschen
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 md:p-6">
        <div className="space-y-2">
          <motion.div
            className="flex flex-col gap-2 md:flex-row"
            initial={{ y: 0 }}
            animate={{ y: isLoading ? [-2, 0, -2] : 0 }}
            transition={{ repeat: isLoading ? Infinity : 0, duration: 0.3 }}
          >
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !showAdditionalFields && addTodo()
              }
              placeholder="Neue Aufgabe hinzufügen..."
              className="w-full bg-white/70 border-gray-200/70 backdrop-blur-sm dark:bg-gray-800/30 dark:border-gray-700/50 dark:placeholder-gray-400"
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                variant="outline"
                size="icon"
                className="shrink-0"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                onClick={addTodo}
                className="rounded-lg bg-gray-900 px-4 py-2 text-white transition-colors hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 md:w-auto shrink-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Hinzufügen
              </Button>
            </div>
          </motion.div>

          <AnimatePresence>
            {showAdditionalFields && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid gap-2 md:grid-cols-2 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                  <Input
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="Link (optional)"
                    className="bg-white/70 border-gray-200/70"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-gray-500" />
                  <Input
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Preis (optional)"
                    className="bg-white/70 border-gray-200/70"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {checklist.todos.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200/60 dark:border-gray-800/40">
            <table className="w-full">
              <thead className="bg-gray-50/80 dark:bg-gray-800/40">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                  <th
                    className="px-2 py-3 font-medium"
                    style={{ width: "40px" }}
                  ></th>
                  <th className="px-2 py-3 font-medium">Aufgabe</th>
                  <th className="px-2 py-3 font-medium">Link</th>
                  <th className="px-2 py-3 font-medium">Preis</th>
                  <th className="px-2 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {checklist.todos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onRemove={removeTodo}
                      onUpdate={updateTodoDetails}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200/60 bg-white/30 p-6 text-center text-gray-500 backdrop-blur-sm dark:border-gray-700/40 dark:bg-gray-800/10 dark:text-gray-400 mt-2">
            <ListTodo className="mx-auto h-8 w-8 mb-2 text-gray-400" />
            Keine Aufgaben vorhanden. Füge eine neue hinzu!
          </div>
        )}

        {activeItemsWithPriceCount > 0 && (
          <CardFooter className="px-0 pt-2 pb-0">
            <div className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-between items-center rounded-lg bg-blue-50/50 p-3 dark:bg-blue-900/20"
              >
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <TrendingUp className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>
                    Gesamtkosten ({activeItemsWithPriceCount}{" "}
                    {activeItemsWithPriceCount === 1 ? "Artikel" : "Artikel"})
                  </span>
                </div>
                <div className="text-lg font-bold text-blue-800 dark:text-blue-300">
                  {formattedTotalPrice}
                </div>
              </motion.div>
            </div>
          </CardFooter>
        )}
      </CardContent>
    </Card>
  );
}
