import type { Request, Response } from "express";
import Project from "../models/Project";
export class ProjectController {
  static getAllProjects = async (req: Request, res: Response) => {
    try {
      const projects = await Project.find({
        $or: [
          { manager: { $in: req.user.id } },
          { team: { $in: req.user.id } },
        ],
      });
      res.json(projects);
    } catch (error) {
      console.log(error);
    }
  };

  static getProjectById = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    try {
      const project = await Project.findById(projectId).populate("tasks");

      if (!project) {
        const error = new Error("Project not found.");
        return res.status(404).json({ error: error.message });
      }

      if (
        project.manager.toString() !== req.user.id.toString() &&
        !project.team.includes(req.user.id)
      ) {
        const error = new Error(
          "You don't have permissions to see this project."
        );
        return res.status(401).json({ error: error.message });
      }

      res.json(project);
    } catch (error) {
      console.log(error);
    }
  };

  static createProject = async (req: Request, res: Response) => {
    const project = new Project(req.body);
    project.manager = req.user.id;
    try {
      await project.save();
      res.send("Project created successfully");
    } catch (error) {
      console.log(error);
    }
  };

  static updateProject = async (req: Request, res: Response) => {
    try {
      req.project.clientName = req.body.clientName;
      req.project.projectName = req.body.projectName;
      req.project.description = req.body.description;
      await req.project.save();
      res.send("Project updated");
    } catch (error) {
      console.log(error);
    }
  };

  static deleteProject = async (req: Request, res: Response) => {
    try {
      await req.project.deleteOne();
      res.send("Project deleted");
    } catch (error) {
      console.log(error);
    }
  };
}
