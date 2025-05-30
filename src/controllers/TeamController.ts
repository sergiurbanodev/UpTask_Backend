import { Response, Request } from "express";
import User from "../models/User";
import Project from "../models/Project";

export class TeamController {
  static findMemberByEmail = async function name(req: Request, res: Response) {
    const { email } = req.body;

    const user = await User.findOne({ email }).select("id email name");

    if (!user) {
      const error = new Error("User not found");
      return res.status(404).json({ error: error.message });
    }

    res.json(user);
  };

  static getProjectTeam = async function name(req: Request, res: Response) {
    const project = await Project.findById(req.project.id).populate({
      path: "team",
      select: "id email name",
    });

    res.json(project.team);
  };

  static addMemberById = async function name(req: Request, res: Response) {
    const { id } = req.body;

    const user = await User.findById(id).select("id");
    if (!user) {
      const error = new Error("User not found");
      return res.status(404).json({ error: error.message });
    }

    if (req.project.team.some((u) => u.toString() === user.id.toString())) {
      const error = new Error("User is already assigned to this project");
      return res.status(409).json({ error: error.message });
    }

    req.project.team.push(user.id);
    await req.project.save();
    res.send("User added correctly");
  };

  static removeMemberById = async function name(req: Request, res: Response) {
    const { userId } = req.params;

    if (!req.project.team.some((u) => u.toString() === userId.toString())) {
      const error = new Error("User not found in this project");
      return res.status(404).json({ error: error.message });
    }

    req.project.team = req.project.team.filter(
      (member) => member.toString() !== userId.toString()
    );

    await req.project.save();
    res.send("User removed correctly");
  };
}
