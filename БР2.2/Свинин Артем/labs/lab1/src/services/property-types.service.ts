import { AppDataSource } from "../config/data-source";
import { ConflictError, NotFoundError } from "../errors/http-errors";
import { PropertyType } from "../models/PropertyType";

interface CreatePropertyTypeInput {
  name: string;
  description?: string;
}

interface UpdatePropertyTypeInput extends Partial<CreatePropertyTypeInput> {}

export class PropertyTypesService {
  private propertyTypeRepository = AppDataSource.getRepository(PropertyType);

  async create(data: CreatePropertyTypeInput) {
    const existingPropertyType = await this.propertyTypeRepository.findOne({
      where: { name: data.name },
    });

    if (existingPropertyType) {
      throw new ConflictError("Тип недвижимости с таким названием уже существует");
    }

    const propertyType = this.propertyTypeRepository.create(data);

    return this.propertyTypeRepository.save(propertyType);
  }

  async getAll() {
    return this.propertyTypeRepository.find({
      order: {
        id: "ASC",
      },
    });
  }

  async getById(id: number) {
    const propertyType = await this.propertyTypeRepository.findOne({
      where: { id },
    });

    if (!propertyType) {
      throw new NotFoundError("Тип недвижимости не найден");
    }

    return propertyType;
  }

  async update(id: number, data: UpdatePropertyTypeInput) {
    const propertyType = await this.propertyTypeRepository.findOne({
      where: { id },
    });

    if (!propertyType) {
      throw new NotFoundError("Тип недвижимости не найден");
    }

    if (data.name && data.name !== propertyType.name) {
      const existingPropertyType = await this.propertyTypeRepository.findOne({
        where: { name: data.name },
      });

      if (existingPropertyType) {
        throw new ConflictError("Тип недвижимости с таким названием уже существует");
      }
    }

    this.propertyTypeRepository.merge(propertyType, data);
    return this.propertyTypeRepository.save(propertyType);
  }

  async delete(id: number) {
    const propertyType = await this.propertyTypeRepository.findOne({
      where: { id },
    });

    if (!propertyType) {
      throw new NotFoundError("Тип недвижимости не найден");
    }

    await this.propertyTypeRepository.remove(propertyType);
  }
}

export const propertyTypesService = new PropertyTypesService();
