import { AppDataSource } from "../config/data-source";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/http-errors";
import { Image } from "../models/Image";
import { Property } from "../models/Property";

interface CreateImageInput {
  propertyId: number;
  imageUrl: string;
  isMain?: boolean;
}

export class ImagesService {
  private imageRepository = AppDataSource.getRepository(Image);
  private propertyRepository = AppDataSource.getRepository(Property);

  async create(data: CreateImageInput, userId: number, userRole: string) {
    const { propertyId, imageUrl, isMain } = data;

    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundError("Объект недвижимости не найден");
    }

    const isOwner = property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Только владелец объекта или администратор может добавлять изображения");
    }

    if (!imageUrl || !imageUrl.trim()) {
      throw new BadRequestError("Ссылка на изображение не может быть пустой");
    }

    if (isMain) {
      await this.imageRepository.update(
        { propertyId, isMain: true },
        { isMain: false }
      );
    }

    const image = this.imageRepository.create({
      propertyId,
      imageUrl: imageUrl.trim(),
      isMain: isMain ?? false,
    });

    return this.imageRepository.save(image);
  }

  async getByPropertyId(propertyId: number) {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundError("Объект недвижимости не найден");
    }

    return this.imageRepository.find({
      where: { propertyId },
      order: {
        id: "ASC",
      },
    });
  }

  async delete(id: number, userId: number, userRole: string) {
    const image = await this.imageRepository.findOne({
      where: { id },
    });

    if (!image) {
      throw new NotFoundError("Изображение не найдено");
    }

    const isOwner = image.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Только владелец объекта или администратор может удалять изображения");
    }

    await this.imageRepository.remove(image);
  }
}

export const imagesService = new ImagesService();
