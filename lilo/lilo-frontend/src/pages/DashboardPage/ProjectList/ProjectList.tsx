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
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
      <h2 className="text-2xl font-bold mb-4">Projects</h2>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-4">Create New Project</Button>
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
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newProject.name}
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>API Spec</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects?.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>{project.spec?.substring(0, 50)}...</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  onClick={() => deleteProject(project.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
