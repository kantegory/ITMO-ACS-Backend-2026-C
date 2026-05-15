import { Request, Response } from "express";
import MessageService from "../services/message.service";
import { getUserIdFromToken } from "common";
import {
  MessageIdParams,
  MessageAccomParams,
  MessageBatchQuery,
  MessageConversationQuery,
  CreateMessageBody,
} from "../types/express";

class MessageController {
  batch = async (
    req: Request<{}, {}, {}, MessageBatchQuery>,
    res: Response,
  ): Promise<void> => {
    try {
      const ids = String(req.query.ids || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      if (!ids.length) {
        return void res.status(400).json({ message: "ids is required" });
      }

      const msgs = await MessageService.batch(ids);
      res.status(200).json(msgs);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getById = async (
    req: Request<MessageIdParams>,
    res: Response,
  ): Promise<void> => {
    try {
      const msg = await MessageService.getById(req.params.id);
      if (!msg) {
        return void res.status(404).json({ message: "Message not found" });
      }
      res.status(200).json(msg);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  create = async (
    req: Request<{}, {}, CreateMessageBody>,
    res: Response,
  ): Promise<void> => {
    try {
      const sender_id = getUserIdFromToken(req);
      const { receiver_id, content, accommodation_id } = req.body;

      if (!sender_id || !receiver_id || !content) {
        res.status(400).json({ message: "Missing required fields" });
        return;
      }

      if (sender_id === receiver_id) {
        res
          .status(400)
          .json({ message: "Sender and receiver cannot be the same" });
        return;
      }

      const users = await MessageService.validateUsers([
        sender_id,
        receiver_id,
      ]);

      const sender = users.find((u) => u.id === sender_id);
      const receiver = users.find((u) => u.id === receiver_id);

      if (!sender || !receiver) {
        res.status(404).json({
          message: !sender ? "Sender not found" : "Receiver not found",
        });
        return;
      }

      if (!sender.is_verified || !receiver.is_verified) {
        res.status(403).json({ message: "User is not verified" });
        return;
      }

      const message = await MessageService.create({
        sender_id,
        receiver_id,
        content,
        accommodation_id,
      });

      res.status(201).json(message);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };

  conversation = async (
    req: Request<{}, {}, {}, MessageConversationQuery>,
    res: Response,
  ): Promise<void> => {
    try {
      const user1 = getUserIdFromToken(req);
      const user2 = req.query.user2;

      if (!user1 || !user2) {
        return void res
          .status(400)
          .json({ message: "Missing required fields" });
      }

      const lim = Number(req.query.limit) || 50;
      const off = Number(req.query.offset) || 0;

      if (lim < 0 || off < 0) {
        return void res
          .status(400)
          .json({ message: "Invalid pagination parameters" });
      }

      const msgs = await MessageService.conversation(user1, user2, lim, off);
      res.status(200).json(msgs);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  byAccommodation = async (
    req: Request<MessageAccomParams, {}, {}, MessageConversationQuery>,
    res: Response,
  ): Promise<void> => {
    try {
      const accomId = req.params.accomId;

      if (!accomId) {
        return void res.status(400).json({ message: "accomId is required" });
      }

      const lim = Number(req.query.limit) || 50;
      const off = Number(req.query.offset) || 0;

      if (lim < 0 || off < 0) {
        return void res
          .status(400)
          .json({ message: "Invalid pagination parameters" });
      }

      const msgs = await MessageService.byAccommodation(accomId, lim, off);
      res.status(200).json(msgs);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteMessage = async (
    req: Request<MessageIdParams>,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return void res.status(400).json({ message: "id is required" });
      }

      const message = await MessageService.getById(id);
      if (!message) {
        return void res.status(404).json({ message: "Message not found" });
      }

      await MessageService.deleteMessage(id);

      res.status(200).json({ message: "Message deleted successfully" });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export default new MessageController();
