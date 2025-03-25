export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  todos: Todo[];
}

export interface Project {
  id: string;
  title: string;
  icon?: string;
  checklists: Checklist[];
}
