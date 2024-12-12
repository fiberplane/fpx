import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  // TableColumn,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useCreateProject, useDeleteProject, useGetProjects } from "./queries";

type Project = {
  id: string;
  name: string;
  apiSpec: string;
};

export function ProjectList() {
  const {
    data: projects,
    // isLoading,
    // error,
  } = useGetProjects();
  const [newProject, setNewProject] = useState<Project>({
    id: "",
    name: "",
    apiSpec: "",
  });
  const { toast } = useToast();
  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();

  const createProject = () => {
    if (!newProject.name || !newProject.apiSpec) {
      toast({
        title: "Error",
        description:
          "Please enter a name and API specification for the project",
        variant: "destructive",
      });
      return;
    }

    createProjectMutation.mutate(
      {
        name: newProject.name,
        spec: newProject.apiSpec,
      },
      {
        onSuccess: () => {
          setNewProject({
            id: "",
            name: "",
            apiSpec: "",
          });
        },
      },
    );
  };

  const deleteProject = (id: string) => {
    deleteProjectMutation.mutate(id);
  };

  return (
    <div>
      <div className="flex items-center gap-6 mb-4">
        <h2 className="text-xl font-semibold">Projects</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <PlusIcon className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Enter the details for your new project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="projectName" className="text-right">
                  Name
                </Label>
                <Input
                  id="projectName"
                  value={newProject.name}
                  autoComplete="off"
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiSpec" className="text-right">
                  API Spec
                </Label>
                <Textarea
                  id="apiSpec"
                  value={newProject.apiSpec}
                  onChange={(e) =>
                    setNewProject({ ...newProject, apiSpec: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>API Spec</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects?.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>{project.spec?.substring(0, 50)}...</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => deleteProject(project.id)}
                >
                  <TrashIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
