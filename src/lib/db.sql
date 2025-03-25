
-- Erstelle Tabelle für Projekte
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Erstelle Tabelle für Checklisten
CREATE TABLE checklists (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Erstelle Tabelle für Kategorien
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    checklist_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50),
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

-- Erstelle Tabelle für Todo-Items
CREATE TABLE todos (
    id UUID PRIMARY KEY,
    checklist_id UUID NOT NULL,
    category_id UUID,
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    price DECIMAL(10, 2),
    notes TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Indizes für schnellere Abfragen
CREATE INDEX idx_checklists_project_id ON checklists(project_id);
CREATE INDEX idx_todos_checklist_id ON todos(checklist_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_categories_checklist_id ON categories(checklist_id);
CREATE INDEX idx_todos_category_id ON todos(category_id);

-- Trigger zur automatischen Aktualisierung von updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_todos_modtime
BEFORE UPDATE ON todos
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Funktionen zur Preisberechnung
CREATE OR REPLACE FUNCTION calculate_checklist_price(checklist_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
    RETURN COALESCE((
        SELECT SUM(price)
        FROM todos
        WHERE checklist_id = checklist_uuid 
        AND completed = FALSE
        AND price IS NOT NULL
    ), 0);
END;
$$ LANGUAGE plpgsql;

-- Funktion zur Berechnung des Kategorie-Preises
CREATE OR REPLACE FUNCTION calculate_category_price(category_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
    RETURN COALESCE((
        SELECT SUM(price)
        FROM todos
        WHERE category_id = category_uuid 
        AND completed = FALSE
        AND price IS NOT NULL
    ), 0);
END;
$$ LANGUAGE plpgsql;

-- Views für häufige Abfragen
CREATE VIEW active_todos_with_price AS
SELECT 
    t.id,
    t.checklist_id,
    t.category_id,
    c.project_id,
    t.text,
    t.price,
    t.link
FROM todos t
JOIN checklists c ON t.checklist_id = c.id
WHERE t.completed = FALSE AND t.price IS NOT NULL;

-- View für Kategorie-Statistiken
CREATE VIEW category_statistics AS
SELECT 
    cat.id,
    cat.name,
    cat.checklist_id,
    COUNT(t.id) AS todo_count,
    COUNT(CASE WHEN t.completed = TRUE THEN 1 END) AS completed_count,
    SUM(CASE WHEN t.completed = FALSE AND t.price IS NOT NULL THEN t.price ELSE 0 END) AS total_active_price
FROM categories cat
LEFT JOIN todos t ON cat.id = t.category_id
GROUP BY cat.id, cat.name, cat.checklist_id;

-- View für Projekt-Statistiken
CREATE VIEW project_statistics AS
SELECT 
    p.id,
    p.name,
    COUNT(DISTINCT c.id) AS checklist_count,
    COUNT(DISTINCT cat.id) AS category_count,
    COUNT(t.id) AS todo_count,
    COUNT(CASE WHEN t.completed = TRUE THEN 1 END) AS completed_count,
    SUM(CASE WHEN t.completed = FALSE AND t.price IS NOT NULL THEN t.price ELSE 0 END) AS total_active_price
FROM projects p
LEFT JOIN checklists c ON p.id = c.project_id
LEFT JOIN categories cat ON c.id = cat.checklist_id
LEFT JOIN todos t ON c.id = t.checklist_id
GROUP BY p.id, p.name;

-- Migrations-Script für bestehende Daten
-- Für den Fall, dass die Tabelle bereits existiert und befüllt ist

-- 1. Erstelle eine Standard-Kategorie für alle Checklisten
DO $$
DECLARE
    checklist_record RECORD;
BEGIN
    FOR checklist_record IN SELECT id FROM checklists LOOP
        INSERT INTO categories (id, checklist_id, name, position)
        VALUES (gen_random_uuid(), checklist_record.id, 'Allgemein', 0);
    END LOOP;
END $$;