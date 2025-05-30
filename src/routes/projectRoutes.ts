import { Router } from "express";
import { ProjectController } from "../controllers/ProjectController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { TaskController } from "../controllers/TaskController";
import { projectExists } from "../middleware/project";
import {
  hasAuthorization,
  taskBelongsToProject,
  taskExists,
} from "../middleware/task";
import { authenticate } from "../middleware/auth";
import { TeamController } from "../controllers/TeamController";
import { NoteController } from "../controllers/NoteController";

const router = Router();

router.use(authenticate);
router.param("projectId", projectExists);

router.get("/", authenticate, ProjectController.getAllProjects);

router.get(
  "/:projectId",
  param("projectId").isMongoId().withMessage("Invalid ID"),
  handleInputErrors,
  ProjectController.getProjectById
);

router.post(
  "/",
  body("projectName").notEmpty().withMessage("Project Name is required"),
  body("clientName").notEmpty().withMessage("Client Name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  handleInputErrors,
  ProjectController.createProject
);

router.put(
  "/:projectId",
  param("projectId").isMongoId().withMessage("Invalid ID"),
  body("projectName").notEmpty().withMessage("Project Name is required"),
  body("clientName").notEmpty().withMessage("Client Name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  handleInputErrors,
  hasAuthorization,
  ProjectController.updateProject
);

router.delete(
  "/:projectId",
  param("projectId").isMongoId().withMessage("Invalid ID"),
  handleInputErrors,
  hasAuthorization,
  ProjectController.deleteProject
);

/** Middlewares for Tasks */
router.param("taskId", taskExists);
router.param("taskId", taskBelongsToProject);

/** Router for tasks */
router.get("/:projectId/tasks", TaskController.getProjectTasks);

router.get(
  "/:projectId/tasks/:taskId",
  param("taskId").isMongoId().withMessage("Invalid ID"),
  handleInputErrors,
  TaskController.getTaskById
);

router.post(
  "/:projectId/tasks",
  hasAuthorization,
  body("name").notEmpty().withMessage("Task name is required"),
  body("description").notEmpty().withMessage("Task description is required"),
  TaskController.createTask
);

router.put(
  "/:projectId/tasks/:taskId",
  hasAuthorization,
  param("taskId").isMongoId().withMessage("Invalid ID"),
  body("name").notEmpty().withMessage("Task name is required"),
  body("description").notEmpty().withMessage("Task description is required"),
  handleInputErrors,
  TaskController.updateTask
);

router.patch(
  "/:projectId/tasks/:taskId/status",
  param("taskId").isMongoId().withMessage("Invalid ID"),
  body("status").notEmpty().withMessage("Task Status is required"),
  handleInputErrors,
  TaskController.updateStatus
);

router.delete(
  "/:projectId/tasks/:taskId",
  hasAuthorization,
  param("taskId").isMongoId().withMessage("Invalid ID"),
  handleInputErrors,
  TaskController.deleteTask
);

/** Routes for Teams */
router.get("/:projectId/team", TeamController.getProjectTeam);
router.post(
  "/:projectId/team/find",
  body("email").isEmail().toLowerCase().withMessage("Invalid E-mail"),
  handleInputErrors,
  TeamController.findMemberByEmail
);

router.post(
  "/:projectId/team",
  body("id").isMongoId().withMessage("Invalid ID"),
  handleInputErrors,
  TeamController.addMemberById
);

router.delete(
  "/:projectId/team/:userId",
  param("userId").isMongoId().withMessage("Invalid ID"),
  handleInputErrors,
  TeamController.removeMemberById
);

/** Routes for Notes */
router.post(
  "/:projectId/tasks/:taskId/notes",
  body("content").notEmpty().withMessage("Note content is required"),
  handleInputErrors,
  NoteController.createNote
);

router.get("/:projectId/tasks/:taskId/notes", NoteController.getTaskNotes);

router.delete(
  "/:projectId/tasks/:taskId/notes/:noteId",
  param("noteId").isMongoId().withMessage("Invalid ID"),
  handleInputErrors,
  NoteController.deleteNote
);

export default router;
