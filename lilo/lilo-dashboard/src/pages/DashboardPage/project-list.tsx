"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Project = {
  id: string
  name: string
  apiSpec: string
  additionalDocs: string
  externalDocs: string
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [newProject, setNewProject] = useState<Project>({
    id: "",
    name: "",
    apiSpec: "",
    additionalDocs: "",
    externalDocs: "",
  })
  const { toast } = useToast()

  const createProject = () => {
    if (!newProject.name || !newProject.apiSpec) {
      toast({
        title: "Error",
        description: "Please enter a name and API specification for the project",
        variant: "destructive",
      })
      return
    }

    const projectWithId = {
      ...newProject,
      id: Math.random().toString(36).substr(2, 9),
    }

    setProjects([...projects, projectWithId])
    setNewProject({
      id: "",
      name: "",
      apiSpec: "",
      additionalDocs: "",
      externalDocs: "",
    })
    toast({
      title: "Project Created",
      description: "Your new project has been created successfully.",
    })
  }

  const deleteProject = (id: string) => {
    setProjects(projects.filter((project) => project.id !== id))
    toast({
      title: "Project Deleted",
      description: "The project has been deleted successfully.",
    })
  }

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
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
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
                onChange={(e) => setNewProject({ ...newProject, apiSpec: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="additionalDocs" className="text-right">
                Additional Docs
              </Label>
              <Textarea
                id="additionalDocs"
                value={newProject.additionalDocs}
                onChange={(e) => setNewProject({ ...newProject, additionalDocs: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="externalDocs" className="text-right">
                External Docs
              </Label>
              <Input
                id="externalDocs"
                value={newProject.externalDocs}
                onChange={(e) => setNewProject({ ...newProject, externalDocs: e.target.value })}
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
            <TableHead>Additional Docs</TableHead>
            <TableHead>External Docs</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>{project.apiSpec.substring(0, 50)}...</TableCell>
              <TableCell>{project.additionalDocs.substring(0, 50)}...</TableCell>
              <TableCell>{project.externalDocs}</TableCell>
              <TableCell>
                <Button variant="destructive" onClick={() => deleteProject(project.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

