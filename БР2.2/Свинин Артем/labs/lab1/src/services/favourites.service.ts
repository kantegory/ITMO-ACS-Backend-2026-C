import { AppDataSource } from "../config/data-source";
import { ConflictError, NotFoundError } from "../errors/http-errors";
import { Favourite } from "../models/Favourite";
import { Property } from "../models/Property";

interface CreateFavouriteInput {
  propertyId: number;
}

export class FavouritesService {
  private favouriteRepository = AppDataSource.getRepository(Favourite);
  private propertyRepository = AppDataSource.getRepository(Property);

  async create(data: CreateFavouriteInput, userId: number) {
    const { propertyId } = data;

    const property = await this.propertyRepository.findOne({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundError("Объект недвижимости не найден");
    }

    const existingFavourite = await this.favouriteRepository.findOne({
      where: { userId, propertyId },
    });

    if (existingFavourite) {
      throw new ConflictError("Этот объект уже добавлен в избранное");
    }

    const favourite = this.favouriteRepository.create({ userId, propertyId });
    return this.favouriteRepository.save(favourite);
  }

  async getMy(userId: number) {
    return this.favouriteRepository.find({
      where: { userId },
      order: { id: "ASC" },
    });
  }

  async deleteByPropertyId(propertyId: number, userId: number) {
    const favourite = await this.favouriteRepository.findOne({
      where: { userId, propertyId },
    });

    if (!favourite) {
      throw new NotFoundError("Объект не найден в избранном");
    }

    await this.favouriteRepository.remove(favourite);
  }

  async deleteById(id: number, userId: number) {
    const favourite = await this.favouriteRepository.findOne({ where: { id } });
    if (!favourite || favourite.userId !== userId) {
      throw new NotFoundError("Объект не найден в избранном");
    }

    await this.favouriteRepository.remove(favourite);
  }
}

export const favouritesService = new FavouritesService();
