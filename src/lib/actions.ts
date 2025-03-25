// app/lib/actions.ts
"use server";
import { neon } from "@neondatabase/serverless";
import { ChecklistData, Todo as ChecklistTodo } from "@/components/Checklist";
import { revalidatePath } from "next/cache";

// Typdefinitionen für die Datenbank
export interface DbProject {
  id: string;
  name: string;
  created_at: string;
}

export interface DbChecklist {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
}

export interface DbCategory {
  id: string;
  checklist_id: string;
  name: string;
  color: string | null;
  position: number;
  created_at: string;
}

export interface DbTodo {
  id: string;
  checklist_id: string;
  category_id: string | null;
  text: string;
  completed: boolean;
  link: string | null;
  price: string | null;
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// Todo-Definition für Frontend
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  link?: string;
  price?: string | number;
  notes?: string;
  position?: number;
  category_id?: string | null;
}

// Kategorie-Definition für Frontend
export interface Category {
  id: string;
  name: string;
  color?: string;
  position: number;
  todos: Todo[];
}

// Verbindung zur Datenbank herstellen
export async function getDbClient() {
  return neon(process.env.DATABASE_URL || "");
}

// Projekte
export async function getAllProjects() {
  try {
    const sql = await getDbClient();
    const projects = await sql`
      SELECT * FROM projects 
      ORDER BY created_at DESC
    `;
    return projects as DbProject[];
  } catch (error) {
    console.error("Fehler beim Abrufen der Projekte:", error);
    return [];
  }
}

export async function getProjectById(id: string) {
  const sql = await getDbClient();
  const projects = await sql`
    SELECT * FROM projects WHERE id = ${id}
  `;
  return projects[0] as DbProject;
}

export async function createProject(name: string) {
  try {
    const sql = await getDbClient();
    const id = crypto.randomUUID();
    const project = await sql`
      INSERT INTO projects (id, name, created_at)
      VALUES (${id}, ${name}, NOW())
      RETURNING *
    `;
    return project[0] as DbProject;
  } catch (error) {
    console.error("Fehler beim Erstellen eines Projekts:", error);
    throw error;
  }
}

export async function updateProject(id: string, name: string) {
  try {
    const sql = await getDbClient();
    const project = await sql`
      UPDATE projects
      SET name = ${name}
      WHERE id = ${id}
      RETURNING *
    `;
    return project[0] as DbProject;
  } catch (error) {
    console.error("Fehler beim Aktualisieren eines Projekts:", error);
    throw error;
  }
}

export async function deleteProject(id: string) {
  try {
    const sql = await getDbClient();
    // Zuerst alle zugehörigen Checklisten und Todos löschen
    await sql`
      DELETE FROM todos 
      WHERE checklist_id IN (
        SELECT id FROM checklists WHERE project_id = ${id}
      )
    `;

    await sql`
      DELETE FROM categories 
      WHERE checklist_id IN (
        SELECT id FROM checklists WHERE project_id = ${id}
      )
    `;

    await sql`
      DELETE FROM checklists 
      WHERE project_id = ${id}
    `;

    await sql`
      DELETE FROM projects 
      WHERE id = ${id}
    `;

    return true;
  } catch (error) {
    console.error("Fehler beim Löschen eines Projekts:", error);
    throw error;
  }
}

// Kategorien
export async function getCategoriesByChecklistId(checklistId: string) {
  const sql = await getDbClient();
  const categories = await sql`
    SELECT * FROM categories 
    WHERE checklist_id = ${checklistId}
    ORDER BY position ASC, created_at ASC
  `;
  return categories as DbCategory[];
}

export async function getCategoryById(id: string) {
  const sql = await getDbClient();
  const categories = await sql`
    SELECT * FROM categories WHERE id = ${id}
  `;
  return categories[0] as DbCategory;
}

export async function createCategory(
  checklistId: string,
  name: string,
  color?: string
) {
  const sql = await getDbClient();
  const id = crypto.randomUUID();

  // Bestimme die höchste Position für eine neue Kategorie
  const positionResult = await sql`
    SELECT COALESCE(MAX(position), -1) + 1 as next_position 
    FROM categories 
    WHERE checklist_id = ${checklistId}
  `;
  const position = parseInt(positionResult[0].next_position) || 0;

  const category = await sql`
    INSERT INTO categories (id, checklist_id, name, color, position)
    VALUES (${id}, ${checklistId}, ${name}, ${color || null}, ${position})
    RETURNING *
  `;
  return category[0] as DbCategory;
}

export async function updateCategory(
  id: string,
  updates: {
    name?: string;
    color?: string | null;
    position?: number;
  }
) {
  const sql = await getDbClient();

  // Aktualisiere die einzelnen Felder
  if (updates.name !== undefined) {
    await sql`
      UPDATE categories 
      SET name = ${updates.name} 
      WHERE id = ${id}
    `;
  }

  if (updates.color !== undefined) {
    await sql`
      UPDATE categories 
      SET color = ${updates.color} 
      WHERE id = ${id}
    `;
  }

  if (updates.position !== undefined) {
    await sql`
      UPDATE categories 
      SET position = ${updates.position} 
      WHERE id = ${id}
    `;
  }

  // Rückgabe der aktualisierten Kategorie
  const category = await sql`
    SELECT * FROM categories WHERE id = ${id}
  `;
  return category[0] as DbCategory;
}

export async function deleteCategory(id: string) {
  const sql = await getDbClient();

  // Setze category_id aller zugehörigen Todos auf NULL
  await sql`
    UPDATE todos 
    SET category_id = NULL 
    WHERE category_id = ${id}
  `;

  // Lösche die Kategorie
  await sql`
    DELETE FROM categories WHERE id = ${id}
  `;

  return true;
}

// Checklisten
export async function getChecklistsByProjectId(projectId: string) {
  const sql = await getDbClient();
  const checklists = await sql`
    SELECT * FROM checklists 
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC
  `;
  return checklists as DbChecklist[];
}

export async function getChecklistById(id: string) {
  const sql = await getDbClient();
  const checklists = await sql`
    SELECT * FROM checklists WHERE id = ${id}
  `;
  return checklists[0] as DbChecklist;
}

export async function createChecklist(projectId: string, title: string) {
  const sql = await getDbClient();
  const id = crypto.randomUUID();
  const checklist = await sql`
    INSERT INTO checklists (id, project_id, title)
    VALUES (${id}, ${projectId}, ${title})
    RETURNING *
  `;

  // Erstelle eine Standardkategorie für die Checkliste
  const categoryId = crypto.randomUUID();
  await sql`
    INSERT INTO categories (id, checklist_id, name, position)
    VALUES (${categoryId}, ${id}, 'Allgemein', 0)
  `;

  return checklist[0] as DbChecklist;
}

export async function updateChecklist(id: string, title: string) {
  const sql = await getDbClient();
  const checklist = await sql`
    UPDATE checklists
    SET title = ${title}
    WHERE id = ${id}
    RETURNING *
  `;
  return checklist[0] as DbChecklist;
}

export async function deleteChecklist(id: string) {
  const sql = await getDbClient();

  // Lösche alle zugehörigen Todos
  await sql`
    DELETE FROM todos WHERE checklist_id = ${id}
  `;

  // Lösche alle zugehörigen Kategorien
  await sql`
    DELETE FROM categories WHERE checklist_id = ${id}
  `;

  // Lösche die Checkliste
  await sql`
    DELETE FROM checklists WHERE id = ${id}
  `;
}

// Todo Items
export async function getTodosByChecklistId(checklistId: string) {
  const sql = await getDbClient();
  const todos = await sql`
    SELECT * FROM todos 
    WHERE checklist_id = ${checklistId}
    ORDER BY position ASC, created_at ASC
  `;
  return todos as DbTodo[];
}

export async function getTodosByCategory(categoryId: string) {
  const sql = await getDbClient();
  const todos = await sql`
    SELECT * FROM todos 
    WHERE category_id = ${categoryId}
    ORDER BY position ASC, created_at ASC
  `;
  return todos as DbTodo[];
}

export async function getTodoById(id: string) {
  const sql = await getDbClient();
  const todos = await sql`
    SELECT * FROM todos WHERE id = ${id}
  `;
  return todos[0] as DbTodo;
}

export async function createTodo(
  checklistId: string,
  todoData: string | { text: string; price?: string; link?: string },
  categoryId?: string
) {
  try {
    const sql = await getDbClient();
    const id = crypto.randomUUID();

    // Bestimme die höchste Position für ein neues Todo
    const positionResult = await sql`
      SELECT COALESCE(MAX(position), -1) + 1 as next_position 
      FROM todos 
      WHERE checklist_id = ${checklistId}
    `;
    const position = parseInt(positionResult[0].next_position) || 0;

    // Wandle todoData in ein Objekt um, falls es ein String ist
    let todoObj: { text: string; price?: string; link?: string };

    if (typeof todoData === "string") {
      try {
        // Versuche, es als JSON zu parsen
        todoObj = JSON.parse(todoData);
      } catch (e) {
        // Wenn das Parsen fehlschlägt, behandele es als einfachen Text
        todoObj = { text: todoData };
      }
    } else {
      todoObj = todoData;
    }

    // Erstelle das Todo mit den extrahierten Daten
    const todo = await sql`
      INSERT INTO todos (
        id, 
        checklist_id, 
        category_id, 
        text, 
        completed, 
        link, 
        price, 
        position
      )
      VALUES (
        ${id}, 
        ${checklistId}, 
        ${categoryId || null}, 
        ${todoObj.text}, 
        false, 
        ${todoObj.link || null}, 
        ${todoObj.price || null}, 
        ${position}
      )
      RETURNING *
    `;

    return todo[0] as DbTodo;
  } catch (error) {
    console.error("Fehler beim Erstellen eines Todos:", error);
    throw error;
  }
}

export async function updateTodo(
  todoId: string,
  updates: Partial<Omit<Todo, "id">> & { category_id?: string | null }
) {
  try {
    const sql = await getDbClient();

    // Bestimme die zu aktualisierenden Felder
    if (updates.text !== undefined) {
      await sql`
        UPDATE todos 
        SET text = ${updates.text} 
        WHERE id = ${todoId}
      `;
    }

    if (updates.completed !== undefined) {
      await sql`
        UPDATE todos 
        SET completed = ${updates.completed} 
        WHERE id = ${todoId}
      `;
    }

    if (updates.link !== undefined) {
      await sql`
        UPDATE todos 
        SET link = ${updates.link || null} 
        WHERE id = ${todoId}
      `;
    }

    if (updates.price !== undefined) {
      await sql`
        UPDATE todos 
        SET price = ${updates.price || null} 
        WHERE id = ${todoId}
      `;
    }

    if (updates.notes !== undefined) {
      await sql`
        UPDATE todos 
        SET notes = ${updates.notes || null} 
        WHERE id = ${todoId}
      `;
    }

    if (updates.category_id !== undefined) {
      await sql`
        UPDATE todos 
        SET category_id = ${updates.category_id} 
        WHERE id = ${todoId}
      `;
    }

    if (updates.position !== undefined) {
      await sql`
        UPDATE todos 
        SET position = ${updates.position} 
        WHERE id = ${todoId}
      `;
    }

    // Aktualisiertes Todo zurückgeben
    const updatedTodo = await sql`
      SELECT * FROM todos 
      WHERE id = ${todoId}
    `;

    return updatedTodo[0] as DbTodo;
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Todos:", error);
    throw error;
  }
}

export async function toggleTodoCompleted(id: string) {
  const sql = await getDbClient();
  const todo = await sql`
    UPDATE todos
    SET completed = NOT completed
    WHERE id = ${id}
    RETURNING *
  `;
  return todo[0] as DbTodo;
}

export async function deleteTodo(todoId: string) {
  try {
    const sql = await getDbClient();
    await sql`
      DELETE FROM todos 
      WHERE id = ${todoId}
    `;
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen des Todos:", error);
    throw error;
  }
}

// Komplette Projektdaten laden
export async function getFullProjectData(projectId: string) {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const checklists = await getChecklistsByProjectId(projectId);

  // Für jede Checkliste die Todos laden
  const checklistsWithTodos = await Promise.all(
    checklists.map(async (checklist) => {
      const todos = await getTodosByChecklistId(checklist.id);

      // Zum Frontend-Format konvertieren
      const formattedTodos: Todo[] = todos.map((todo) => ({
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
        category_id: todo.category_id || undefined,
        position: todo.position,
        link: todo.link || undefined,
        price: todo.price || undefined,
        notes: todo.notes || undefined,
      }));

      return {
        id: checklist.id,
        title: checklist.title,
        todos: formattedTodos,
      };
    })
  );

  return {
    project,
    checklists: checklistsWithTodos,
  };
}

// Hole eine Checkliste mit allen Todos, gruppiert nach Kategorien
export async function getChecklistWithCategories(projectId: string) {
  try {
    const sql = await getDbClient();

    // Zuerst die Checkliste für das Projekt abrufen
    const checklists = await sql`
      SELECT * FROM checklists
      WHERE project_id = ${projectId}
    `;

    if (!checklists.length) {
      return null;
    }

    const checklist = checklists[0];

    // Kategorien für die Checkliste laden
    const categories = await getCategoriesByChecklistId(checklist.id);

    // Todos für die Checkliste laden
    const allTodos = await getTodosByChecklistId(checklist.id);

    // Todos ohne Kategorie finden
    const uncategorizedTodos = allTodos.filter((todo) => !todo.category_id);

    // Kategorien mit ihren Todos erstellen
    const categoriesWithTodos = await Promise.all(
      categories.map(async (category) => {
        // Todos für diese Kategorie finden
        const categoryTodos = allTodos.filter(
          (todo) => todo.category_id === category.id
        );

        // Formatierte Todos erstellen
        const formattedTodos = categoryTodos.map((todo) => ({
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
          position: todo.position,
          link: todo.link || undefined,
          price: todo.price || undefined,
          notes: todo.notes || undefined,
        }));

        return {
          id: category.id,
          name: category.name,
          color: category.color || undefined,
          position: category.position,
          todos: formattedTodos,
        };
      })
    );

    // Formatierte Todos ohne Kategorie
    const formattedUncategorizedTodos = uncategorizedTodos.map((todo) => ({
      id: todo.id,
      text: todo.text,
      completed: todo.completed,
      position: todo.position,
      link: todo.link || undefined,
      price: todo.price || undefined,
      notes: todo.notes || undefined,
    }));

    return {
      id: checklist.id,
      title: checklist.title,
      categories: categoriesWithTodos,
      uncategorizedTodos: formattedUncategorizedTodos,
      project_id: checklist.project_id,
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der Checkliste mit Kategorien:", error);
    return null;
  }
}

// Hole eine Checkliste mit allen Todos (ohne Kategorien - für Abwärtskompatibilität)
export async function getChecklistWithTodos(projectId: string) {
  try {
    const sql = await getDbClient();

    // Zuerst die Checkliste für das Projekt abrufen
    const checklists = await sql`
      SELECT * FROM checklists
      WHERE project_id = ${projectId}
    `;

    if (!checklists.length) {
      return null;
    }

    const checklist = checklists[0];

    // Dann die Todos für die Checkliste abrufen
    const todos = await sql`
      SELECT * FROM todos
      WHERE checklist_id = ${checklist.id}
      ORDER BY position ASC, created_at ASC
    `;

    return {
      id: checklist.id,
      title: checklist.title,
      todos: todos.map((todo: Record<string, any>) => ({
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
        category_id: todo.category_id || undefined,
        position: todo.position,
        price: todo.price,
        link: todo.link,
        notes: todo.notes,
      })),
      project_id: checklist.project_id,
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der Checkliste:", error);
    return null;
  }
}

// Speichere eine komplette Checkliste mit allen Todos und Kategorien
export async function saveChecklistWithCategories(checklistData: {
  id: string;
  title: string;
  categories: Category[];
  uncategorizedTodos: Todo[];
  project_id: string;
}) {
  try {
    const sql = await getDbClient();

    // Prüfen, ob die Checkliste existiert
    const checklistExists = await sql`
      SELECT COUNT(*) as count FROM checklists
      WHERE id = ${checklistData.id}
    `;

    const exists = parseInt(checklistExists[0].count) > 0;

    // Checkliste erstellen oder aktualisieren
    if (!exists) {
      // Neue Checkliste erstellen
      await sql`
        INSERT INTO checklists (id, title, project_id, created_at)
        VALUES (${checklistData.id}, ${checklistData.title}, ${checklistData.project_id}, NOW())
      `;
    } else {
      // Bestehende Checkliste aktualisieren
      await sql`
        UPDATE checklists
        SET title = ${checklistData.title}
        WHERE id = ${checklistData.id}
      `;
    }

    // Bestehende Kategorien abrufen
    const existingCategories = await sql`
      SELECT * FROM categories
      WHERE checklist_id = ${checklistData.id}
    `;

    const existingCategoryIds = existingCategories.map(
      (cat: Record<string, any>) => cat.id
    );
    const newCategoryIds = checklistData.categories.map((cat) => cat.id);

    // Kategorien löschen, die nicht mehr vorhanden sind
    const categoriesToDelete = existingCategoryIds.filter(
      (id: string) => !newCategoryIds.includes(id)
    );

    if (categoriesToDelete.length > 0) {
      for (const categoryId of categoriesToDelete) {
        await deleteCategory(categoryId);
      }
    }

    // Kategorien aktualisieren oder erstellen
    for (const category of checklistData.categories) {
      if (existingCategoryIds.includes(category.id)) {
        // Kategorie aktualisieren
        await sql`
          UPDATE categories
          SET 
            name = ${category.name},
            color = ${category.color || null},
            position = ${category.position}
          WHERE id = ${category.id}
        `;
      } else {
        // Neue Kategorie erstellen
        await sql`
          INSERT INTO categories (
            id, 
            checklist_id, 
            name, 
            color, 
            position
          )
          VALUES (
            ${category.id}, 
            ${checklistData.id}, 
            ${category.name}, 
            ${category.color || null}, 
            ${category.position}
          )
        `;
      }

      // Todos für diese Kategorie verarbeiten
      for (const todo of category.todos) {
        await saveTodo(todo, checklistData.id, category.id);
      }
    }

    // Todos ohne Kategorie verarbeiten
    for (const todo of checklistData.uncategorizedTodos) {
      await saveTodo(todo, checklistData.id, null);
    }

    // Aktualisierte Checkliste zurückgeben
    return await getChecklistWithCategories(checklistData.project_id);
  } catch (error) {
    console.error(
      "Fehler beim Speichern der Checkliste mit Kategorien:",
      error
    );
    throw error;
  }
}

// Hilfsfunktion zum Speichern eines einzelnen Todos
async function saveTodo(
  todo: Todo,
  checklistId: string,
  categoryId: string | null
) {
  const sql = await getDbClient();

  // Prüfen, ob das Todo existiert
  const todoExists = await sql`
    SELECT COUNT(*) as count FROM todos 
    WHERE id = ${todo.id}
  `;

  const exists = parseInt(todoExists[0].count) > 0;

  if (exists) {
    // Todo aktualisieren
    await sql`
      UPDATE todos
      SET 
        text = ${todo.text},
        completed = ${todo.completed},
        category_id = ${categoryId},
        position = ${todo.position || 0},
        price = ${todo.price || null},
        link = ${todo.link || null},
        notes = ${todo.notes || null}
      WHERE id = ${todo.id}
    `;
  } else {
    // Neues Todo erstellen
    await sql`
      INSERT INTO todos (
        id, 
        checklist_id, 
        category_id,
        text, 
        completed, 
        position,
        price, 
        link, 
        notes, 
        created_at
      )
      VALUES (
        ${todo.id}, 
        ${checklistId}, 
        ${categoryId},
        ${todo.text}, 
        ${todo.completed}, 
        ${todo.position || 0},
        ${todo.price || null}, 
        ${todo.link || null}, 
        ${todo.notes || null}, 
        NOW()
      )
    `;
  }

  return true;
}

// Für Abwärtskompatibilität: Speichere eine Checkliste ohne Kategorien
export async function saveChecklist(checklist: {
  id: string;
  title: string;
  todos: Todo[];
  project_id: string;
}) {
  try {
    const sql = await getDbClient();

    // Prüfen, ob die Checkliste bereits existiert
    const checklistExists = await sql`
      SELECT COUNT(*) as count FROM checklists
      WHERE id = ${checklist.id}
    `;

    const exists = parseInt(checklistExists[0].count) > 0;

    if (!exists) {
      // Neue Checkliste erstellen
      await sql`
        INSERT INTO checklists (id, title, project_id, created_at)
        VALUES (${checklist.id}, ${checklist.title}, ${checklist.project_id}, NOW())
      `;

      // Standardkategorie für neue Checkliste erstellen
      const categoryId = crypto.randomUUID();
      await sql`
        INSERT INTO categories (id, checklist_id, name, position)
        VALUES (${categoryId}, ${checklist.id}, 'Allgemein', 0)
      `;
    } else {
      // Bestehende Checkliste aktualisieren
      await sql`
        UPDATE checklists
        SET title = ${checklist.title}
        WHERE id = ${checklist.id}
      `;
    }

    // Bestehende Todos für diese Checkliste abrufen
    const existingTodos = await sql`
      SELECT * FROM todos
      WHERE checklist_id = ${checklist.id}
    `;

    const existingTodoIds = existingTodos.map(
      (todo: Record<string, any>) => todo.id
    );
    const newTodoIds = checklist.todos.map((todo) => todo.id);

    // Todos, die nicht mehr in der Checkliste sind, löschen
    const todosToDelete = existingTodoIds.filter(
      (id: string) => !newTodoIds.includes(id)
    );

    if (todosToDelete.length > 0) {
      for (const todoId of todosToDelete) {
        await sql`
          DELETE FROM todos
          WHERE id = ${todoId}
        `;
      }
    }

    // Standardkategorie für diese Checkliste abrufen
    const defaultCategory = await sql`
      SELECT id FROM categories
      WHERE checklist_id = ${checklist.id}
      ORDER BY position ASC, created_at ASC
      LIMIT 1
    `;

    const defaultCategoryId =
      defaultCategory.length > 0 ? defaultCategory[0].id : null;

    // Todos aktualisieren oder erstellen
    for (const todo of checklist.todos) {
      if (existingTodoIds.includes(todo.id)) {
        // Todo aktualisieren
        await sql`
          UPDATE todos
          SET 
            text = ${todo.text},
            completed = ${todo.completed},
            position = ${todo.position || 0},
            price = ${todo.price || null},
            link = ${todo.link || null},
            notes = ${todo.notes || null}
          WHERE id = ${todo.id}
        `;
      } else {
        // Neues Todo erstellen
        await sql`
          INSERT INTO todos (
            id, 
            checklist_id, 
            category_id,
            text, 
            completed, 
            position,
            price, 
            link, 
            notes, 
            created_at
          )
          VALUES (
            ${todo.id}, 
            ${checklist.id}, 
            ${todo.category_id || defaultCategoryId},
            ${todo.text}, 
            ${todo.completed}, 
            ${todo.position || 0},
            ${todo.price || null}, 
            ${todo.link || null}, 
            ${todo.notes || null}, 
            NOW()
          )
        `;
      }
    }

    // Aktualisierte Checkliste zurückgeben
    return await getChecklistWithTodos(checklist.project_id);
  } catch (error) {
    console.error("Fehler beim Speichern der Checkliste:", error);
    throw error;
  }
}
