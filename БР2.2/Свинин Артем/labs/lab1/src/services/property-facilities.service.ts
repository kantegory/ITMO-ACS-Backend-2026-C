import { AppDataSource } from "../config/data-source";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors/http-errors";
import { Facility } from "../models/Facility";
import { Property } from "../models/Property";
import { PropertyFacility } from "../models/PropertyFacility";

interface CreatePropertyFacilityInput {
  propertyId: number;
  facilityId: number;
}

export class PropertyFacilitiesService {
  private propertyFacilityRepository = AppDataSource.getRepository(PropertyFacility);
  private propertyRepository = AppDataSource.getRepository(Property);
  private facilityRepository = AppDataSource.getRepository(Facility);

  async create(data: CreatePropertyFacilityInput, userId: number, userRole: string) {
    const { propertyId, facilityId } = data;

    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundError("Объект недвижимости не найден");
    }

    const facility = await this.facilityRepository.findOne({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundError("Удобство не найдено");
    }

    const isOwner = property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Только владелец объекта или администратор может добавлять удобства");
    }

    const existingPropertyFacility = await this.propertyFacilityRepository.findOne({
      where: { propertyId, facilityId },
    });

    if (existingPropertyFacility) {
      throw new ConflictError("Это удобство уже добавлено к объекту недвижимости");
    }

    const propertyFacility = this.propertyFacilityRepository.create({
      propertyId,
      facilityId,
    });

    return this.propertyFacilityRepository.save(propertyFacility);
  }

  async getByPropertyId(propertyId: number) {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundError("Объект недвижимости не найден");
    }

    return this.propertyFacilityRepository.find({
      where: { propertyId },
      order: {
        id: "ASC",
      },
    });
  }

  async delete(id: number, userId: number, userRole: string) {
    const propertyFacility = await this.propertyFacilityRepository.findOne({
      where: { id },
    });

    if (!propertyFacility) {
      throw new NotFoundError("Связь удобства с объектом недвижимости не найдена");
    }

    const isOwner = propertyFacility.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Только владелец объекта или администратор может удалять удобства");
    }

    await this.propertyFacilityRepository.remove(propertyFacility);
  }
}

export const propertyFacilitiesService = new PropertyFacilitiesService();
