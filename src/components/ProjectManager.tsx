"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FolderPlus,
  Folder,
  MoreVertical,
  X,
  Edit,
  Plus,
  CalendarDays,
  Loader2,
  Trash2,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checklist, ChecklistData } from "./Checklist";
import {
  ChecklistWithCategories,
  ChecklistWithCategoriesData,
} from "./ChecklistWithCategories";
import {
  createProject,
  getAllProjects,
  getChecklistWithTodos,
  getChecklistWithCategories,
  saveChecklist,
  saveChecklistWithCategories,
  updateProject,
  deleteProject,
  DbProject,
} from "@/lib/actions";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import Spinner from "@/components/Spinner";

interface Project {
  id: string;
  name: string;
  checklist: ChecklistData;
  checklistWithCategories?: ChecklistWithCategoriesData;
  createdAt: Date;
}

export function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [useCategories, setUseCategories] = useState(true);

  // Projekt-Daten beim ersten Rendern laden
  useEffect(() => {
    async function loadProjects() {
      try {
        setIsLoading(true);
        const dbProjects = await getAllProjects();

        if (!dbProjects || dbProjects.length === 0) {
          // Standard-Projekt erstellen, wenn keine Projekte existieren
          const defaultProject = await createProject("Mein erstes Projekt");
          const emptyChecklist: ChecklistData = {
            id: crypto.randomUUID(),
            title: "Projektaufgaben",
            todos: [],
            project_id: defaultProject.id,
          };

          // Speichere die leere Checkliste in der Datenbank
          await saveChecklist(emptyChecklist);

          // Projekte erneut laden
          const refreshedProjects = await getAllProjects();

          // Projekte konvertieren und speichern
          if (refreshedProjects && refreshedProjects.length > 0) {
            const convertedProjects = await Promise.all(
              refreshedProjects.map(async (dbProject) => {
                // Checklisten für das Projekt laden (mit und ohne Kategorien)
                const checklist = (await getChecklistWithTodos(
                  dbProject.id
                )) || {
                  id: crypto.randomUUID(),
                  title: "Projektaufgaben",
                  todos: [],
                  project_id: dbProject.id,
                };

                const checklistWithCategories =
                  await getChecklistWithCategories(dbProject.id);

                return {
                  id: dbProject.id,
                  name: dbProject.name,
                  checklist,
                  checklistWithCategories,
                  createdAt: new Date(dbProject.created_at),
                };
              })
            );

            setProjects(convertedProjects);
            setActiveProjectId(convertedProjects[0]?.id || null);
          }
        } else {
          // Projekte konvertieren und speichern
          const convertedProjects = await Promise.all(
            dbProjects.map(async (dbProject) => {
              // Checklisten für das Projekt laden (mit und ohne Kategorien)
              const checklist = (await getChecklistWithTodos(dbProject.id)) || {
                id: crypto.randomUUID(),
                title: "Projektaufgaben",
                todos: [],
                project_id: dbProject.id,
              };

              const checklistWithCategories = await getChecklistWithCategories(
                dbProject.id
              );

              return {
                id: dbProject.id,
                name: dbProject.name,
                checklist,
                checklistWithCategories,
                createdAt: new Date(dbProject.created_at),
              };
            })
          );

          setProjects(convertedProjects);
          setActiveProjectId(convertedProjects[0]?.id || null);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Projekte:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProjects();
  }, []);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  const addProject = async () => {
    if (newProjectName.trim() === "") return;

    setIsLoading(true);

    try {
      // Projekt in der Datenbank erstellen
      const dbProject = await createProject(newProjectName);

      // Neue Checkliste für das Projekt erstellen
      const newChecklist: ChecklistData = {
        id: crypto.randomUUID(),
        title: "Projektaufgaben",
        todos: [],
        project_id: dbProject.id,
      };

      // Checkliste in der Datenbank speichern
      const savedChecklist = await saveChecklist(newChecklist);

      // Neues Projekt zum Zustand hinzufügen
      const newProject: Project = {
        id: dbProject.id,
        name: dbProject.name,
        checklist: savedChecklist || newChecklist,
        createdAt: new Date(dbProject.created_at),
      };

      setProjects([...projects, newProject]);
      setActiveProjectId(newProject.id);
      setNewProjectName("");
      setIsAddingProject(false);
    } catch (error) {
      console.error("Fehler beim Erstellen des Projekts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renameProject = async (id: string) => {
    if (editProjectName.trim() === "") return;

    setIsLoading(true);

    try {
      // Projekt in der Datenbank aktualisieren
      const updatedProject = await updateProject(id, editProjectName);

      // Projekte aktualisieren
      setProjects(
        projects.map((project) =>
          project.id === id
            ? {
                ...project,
                name: updatedProject.name,
              }
            : project
        )
      );

      // Bearbeitungsmodus beenden
      setEditProjectId(null);
      setEditProjectName("");
    } catch (error) {
      console.error("Fehler beim Umbenennen des Projekts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteProject = (id: string) => {
    setProjectToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsLoading(true);

    try {
      // Projekt aus der Datenbank löschen
      await deleteProject(projectToDelete);

      // Projekte aktualisieren
      const updatedProjects = projects.filter(
        (project) => project.id !== projectToDelete
      );

      setProjects(updatedProjects);

      // Wenn das aktive Projekt gelöscht wurde, wechsle zum ersten Projekt
      if (activeProjectId === projectToDelete) {
        setActiveProjectId(updatedProjects[0]?.id || null);
      }

      // Dialog schließen
      setIsConfirmDeleteOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Fehler beim Löschen des Projekts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  async function handleUpdateChecklist(updatedChecklist: ChecklistData) {
    await saveChecklist(updatedChecklist);

    // Aktualisiere das Projekt in der lokalen State
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === activeProjectId
          ? { ...project, checklist: updatedChecklist }
          : project
      )
    );
  }

  async function handleUpdateChecklistWithCategories(
    updatedChecklist: ChecklistWithCategoriesData
  ) {
    await saveChecklistWithCategories(updatedChecklist);

    // Aktualisiere das Projekt in der lokalen State
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === activeProjectId
          ? { ...project, checklistWithCategories: updatedChecklist }
          : project
      )
    );
  }

  // Handler für das Ändern des Checklistenmodus (mit oder ohne Kategorien)
  function toggleCategoriesMode() {
    setUseCategories(!useCategories);
  }

  // Render-Logik für aktive Checkliste
  function renderActiveChecklist() {
    if (!activeProject) return null;

    if (useCategories) {
      // Wenn keine kategorisierte Checkliste existiert, erstelle eine neue
      if (!activeProject.checklistWithCategories) {
        const newChecklistWithCategories: ChecklistWithCategoriesData = {
          id: crypto.randomUUID(),
          title: activeProject.checklist.title || "Projektaufgaben",
          project_id: activeProject.id,
          categories: [],
        };

        // Setze die neue Checkliste und speichere sie
        handleUpdateChecklistWithCategories(newChecklistWithCategories);

        return (
          <ChecklistWithCategories
            checklist={newChecklistWithCategories}
            onUpdate={handleUpdateChecklistWithCategories}
          />
        );
      }

      return (
        <ChecklistWithCategories
          checklist={activeProject.checklistWithCategories}
          onUpdate={handleUpdateChecklistWithCategories}
        />
      );
    } else {
      return (
        <Checklist
          checklist={activeProject.checklist}
          onUpdate={handleUpdateChecklist}
        />
      );
    }
  }

  // Render-Logik für den Toggle-Button
  function renderCategoriesToggle() {
    return (
      <Button onClick={toggleCategoriesMode} className="mb-2" variant="outline">
        {useCategories ? "Standard-Ansicht" : "Kategorien-Ansicht"}
      </Button>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  // Lade-Zustand anzeigen
  if (isLoading && projects.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
        <span className="ml-2 text-gray-500">Daten werden geladen...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header und Projektverwaltung */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Projekt-Manager</h1>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          {!isAddingProject ? (
            <Button
              onClick={() => {
                setIsAddingProject(true);
                setNewProjectName("");
              }}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neues Projekt
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Projektname"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full md:w-auto"
              />
              <Button
                onClick={async () => {
                  if (newProjectName.trim()) {
                    const newProject = await createProject(newProjectName);
                    const emptyChecklist: ChecklistData = {
                      id: crypto.randomUUID(),
                      title: "Projektaufgaben",
                      todos: [],
                      project_id: newProject.id,
                    };

                    await saveChecklist(emptyChecklist);

                    // Erstelle auch eine leere kategorisierte Checkliste
                    const emptyChecklistWithCategories: ChecklistWithCategoriesData =
                      {
                        id: crypto.randomUUID(),
                        title: "Projektaufgaben",
                        project_id: newProject.id,
                        categories: [],
                      };

                    await saveChecklistWithCategories(
                      emptyChecklistWithCategories
                    );

                    setProjects([
                      ...projects,
                      {
                        id: newProject.id,
                        name: newProject.name,
                        checklist: emptyChecklist,
                        checklistWithCategories: emptyChecklistWithCategories,
                        createdAt: new Date(newProject.created_at),
                      },
                    ]);

                    setActiveProjectId(newProject.id);
                    setIsAddingProject(false);
                  }
                }}
                variant="default"
              >
                Speichern
              </Button>
              <Button
                onClick={() => setIsAddingProject(false)}
                variant="outline"
              >
                Abbrechen
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Projekt-Auswahl und Inhalt */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Meine Projekte</h2>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center justify-between p-3 border rounded-md ${
                    project.id === activeProjectId
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <button
                    className="text-left flex-1 truncate"
                    onClick={() => setActiveProjectId(project.id)}
                  >
                    {editProjectId === project.id ? (
                      <Input
                        type="text"
                        value={editProjectName}
                        onChange={(e) => setEditProjectName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      project.name
                    )}
                  </button>
                  <div className="flex space-x-1">
                    {editProjectId === project.id ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (editProjectName.trim()) {
                              await renameProject(project.id);
                            }
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditProjectId(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditProjectId(project.id);
                            setEditProjectName(project.name);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(project.id);
                            setIsConfirmDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-3">
          {activeProject ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{activeProject.name}</h2>
                {renderCategoriesToggle()}
              </div>
              {renderActiveChecklist()}
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 border border-dashed rounded-md border-gray-300 text-gray-500">
              Wähle ein Projekt aus oder erstelle ein neues
            </div>
          )}
        </div>
      </div>

      {/* Bestätigungsdialog für Projektlöschung */}
      {isConfirmDeleteOpen && (
        <DeleteConfirmDialog
          isOpen={isConfirmDeleteOpen}
          onClose={() => {
            setIsConfirmDeleteOpen(false);
            setProjectToDelete(null);
          }}
          onConfirm={handleDeleteProject}
          title="Projekt löschen"
          description="Bist du sicher, dass du dieses Projekt löschen möchtest? Alle zugehörigen Daten werden unwiderruflich gelöscht."
        />
      )}
    </div>
  );
}
