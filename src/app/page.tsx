import { ProjectManager } from "@/components/ProjectManager";
import { ListChecks } from "lucide-react";

export default async function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl w-full p-6 border-b border-gray-200/50 dark:border-gray-800/50 flex">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center">
          <ListChecks className="mr-3 h-8 w-8 text-gray-800 dark:text-gray-200" />
          Checklisten-App
        </h1>
      </div>

      <main className="flex flex-1 flex-col items-center p-4 md:p-8">
        <ProjectManager />
      </main>
    </div>
  );
}
