import dataSource from "../config/data-source";
import { Message } from "../models/message.entity";
import { MessageUser } from "../models/user-cache.entity";
import { MessageDto, UserValDTO } from "../dto/message.dto";
import { Topics, publish, serviceGet } from "common";
import settings from "../config/config";

class MessageService {
  private messageRepository = dataSource.getRepository(Message);
  private userCacheRepository = dataSource.getRepository(MessageUser);

  async validateUsers(userIds: string[]): Promise<UserValDTO[]> {
    const ids = userIds.join(",");
    const url = `${settings.USER_URL}/internal/batch?ids=${encodeURIComponent(ids)}`;
    return await serviceGet<UserValDTO[]>(url);
  }

  async create(payload: {
    sender_id: string;
    receiver_id: string;
    content: string;
    accommodation_id?: string;
  }): Promise<MessageDto> {
    const message = this.messageRepository.create({
      sender_id: payload.sender_id,
      receiver_id: payload.receiver_id,
      content: payload.content,
      accommodation_id: payload.accommodation_id,
    });
    const saved = await this.messageRepository.save(message);

    await publish(Topics.Message, {
      eventType: "message.sent",
      messageId: saved.id,
      fromUserId: saved.sender_id,
      toUserId: saved.receiver_id,
      content: saved.content,
      accommodationId: saved.accommodation_id ?? "",
      timestamp: Date.now(),
    });

    const senderName =
      (await this.getUserNameFromCache(payload.sender_id)) ?? "Unknown";
    const receiverName =
      (await this.getUserNameFromCache(payload.receiver_id)) ?? "Unknown";

    return this.toDto(saved, senderName, receiverName);
  }

  async conversation(
    user1: string,
    user2: string,
    limit = 50,
    offset = 0,
  ): Promise<MessageDto[]> {
    const messages = await this.messageRepository
      .createQueryBuilder("m")
      .where(
        "(m.sender_id = :user1 AND m.receiver_id = :user2) OR (m.sender_id = :user2 AND m.receiver_id = :user1)",
        { user1, user2 },
      )
      .orderBy("m.created_at", "ASC")
      .skip(offset)
      .take(limit)
      .getMany();

    const userIds = new Set<string>();
    messages.forEach((m) => {
      userIds.add(m.sender_id);
      userIds.add(m.receiver_id);
    });

    const nameMap = await this.getUserNameMapFromCache([...userIds]);

    return messages.map((m) =>
      this.toDto(
        m,
        nameMap.get(m.sender_id) ?? "Unknown",
        nameMap.get(m.receiver_id) ?? "Unknown",
      ),
    );
  }

  async batch(ids: string[]): Promise<MessageDto[]> {
    if (!ids.length) return [];
    const messages = await this.messageRepository
      .createQueryBuilder("m")
      .where("m.id IN (:...ids)", { ids })
      .getMany();

    const userIds = new Set<string>();
    messages.forEach((m) => {
      userIds.add(m.sender_id);
      userIds.add(m.receiver_id);
    });
    const nameMap = await this.getUserNameMapFromCache([...userIds]);

    return messages.map((m) =>
      this.toDto(
        m,
        nameMap.get(m.sender_id) ?? "Unknown",
        nameMap.get(m.receiver_id) ?? "Unknown",
      ),
    );
  }

  async getById(id: string): Promise<MessageDto | undefined> {
    const message = await this.messageRepository.findOneBy({ id });
    if (!message) return undefined;
    const senderName =
      (await this.getUserNameFromCache(message.sender_id)) ?? "Unknown";
    const receiverName =
      (await this.getUserNameFromCache(message.receiver_id)) ?? "Unknown";
    return this.toDto(message, senderName, receiverName);
  }

  async byAccommodation(
    accomId: string,
    limit = 50,
    offset = 0,
  ): Promise<MessageDto[]> {
    const messages = await this.messageRepository
      .createQueryBuilder("m")
      .where("m.accommodation_id = :accomId", { accomId })
      .orderBy("m.created_at", "ASC")
      .skip(offset)
      .take(limit)
      .getMany();

    const userIds = new Set<string>();
    messages.forEach((m) => {
      userIds.add(m.sender_id);
      userIds.add(m.receiver_id);
    });
    const nameMap = await this.getUserNameMapFromCache([...userIds]);

    return messages.map((m) =>
      this.toDto(
        m,
        nameMap.get(m.sender_id) ?? "Unknown",
        nameMap.get(m.receiver_id) ?? "Unknown",
      ),
    );
  }

  async deleteMessage(id: string): Promise<void> {
    await this.messageRepository.delete(id);
  }

  async getConversationIdByRentId(rentId: string) {
    return null;
  }

  private toDto(
    m: Message,
    senderName?: string,
    receiverName?: string,
  ): MessageDto {
    return {
      id: m.id,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      sender_name: senderName ?? "Unknown",
      receiver_name: receiverName ?? "Unknown",
      content: m.content,
      accommodation_id: m.accommodation_id,
      created_at: m.created_at,
      updated_at: m.updated_at,
    };
  }

  private async getUserNameFromCache(
    userId: string,
  ): Promise<string | undefined> {
    const cached = await this.userCacheRepository.findOne({
      where: { user_id: userId },
    });
    return cached?.user_name;
  }

  private async getUserNameMapFromCache(
    userIds: string[],
  ): Promise<Map<string, string>> {
    const nameMap = new Map<string, string>();
    if (userIds.length === 0) return nameMap;

    const cached = await this.userCacheRepository.find({
      where: userIds.map((id) => ({ user_id: id })),
    });
    cached.forEach((c) => nameMap.set(c.user_id, c.user_name));

    return nameMap;
  }
}

export default new MessageService();
