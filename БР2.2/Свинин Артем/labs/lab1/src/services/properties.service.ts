import { AppDataSource } from "../config/data-source";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/http-errors";
import { Address } from "../models/Address";
import { Property } from "../models/Property";
import { PropertyType } from "../models/PropertyType";

interface CreatePropertyInput {
  typeId: number;
  addressId: number;
  title: string;
  description: string;
  pricePerDay: string;
  pricePerMonth: string;
  areaSqM: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  isAvailable?: boolean;
  minRentDays: number;
  maxRentDays: number;
}

interface UpdatePropertyInput extends Partial<CreatePropertyInput> {}

export class PropertiesService {
  private propertyRepository = AppDataSource.getRepository(Property);
  private addressRepository = AppDataSource.getRepository(Address);
  private propertyTypeRepository = AppDataSource.getRepository(PropertyType);

  async create(data: CreatePropertyInput, ownerId: number) {
    const {
      typeId,
      addressId,
      title,
      description,
      pricePerDay,
      pricePerMonth,
      areaSqM,
      maxGuests,
      bedrooms,
      bathrooms,
      isAvailable,
      minRentDays,
      maxRentDays,
    } = data;

    const address = await this.addressRepository.findOne({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundError("Адрес не найден");
    }

    const propertyType = await this.propertyTypeRepository.findOne({
      where: { id: typeId },
    });

    if (!propertyType) {
      throw new NotFoundError("Тип недвижимости не найден");
    }

    this.validatePropertyData({
      pricePerDay,
      pricePerMonth,
      areaSqM,
      maxGuests,
      bedrooms,
      bathrooms,
      minRentDays,
      maxRentDays,
    });

    const property = this.propertyRepository.create({
      ownerId,
      typeId,
      addressId,
      title,
      description,
      pricePerDay,
      pricePerMonth,
      areaSqM,
      maxGuests,
      bedrooms,
      bathrooms,
      isAvailable: isAvailable ?? true,
      minRentDays,
      maxRentDays,
    });

    return this.propertyRepository.save(property);
  }

  async getAll() {
    return this.propertyRepository.find({
      order: {
        id: "ASC",
      },
    });
  }

  async getMy(ownerId: number) {
    return this.propertyRepository.find({
      where: { ownerId },
      order: {
        id: "ASC",
      },
    });
  }

  async getById(id: number) {
    const property = await this.propertyRepository.findOne({
      where: { id },
    });

    if (!property) {
      throw new NotFoundError("Объект недвижимости не найден");
    }

    return property;
  }

  async update(id: number, data: UpdatePropertyInput, userId: number, userRole: string) {
    const property = await this.propertyRepository.findOne({
      where: { id },
    });

    if (!property) {
      throw new NotFoundError("Объект недвижимости не найден");
    }

    this.ensureCanManageProperty(property, userId, userRole);

    if (data.addressId !== undefined) {
      const address = await this.addressRepository.findOne({
        where: { id: data.addressId },
      });

      if (!address) {
        throw new NotFoundError("Адрес не найден");
      }
    }

    if (data.typeId !== undefined) {
      const propertyType = await this.propertyTypeRepository.findOne({
        where: { id: data.typeId },
      });

      if (!propertyType) {
        throw new NotFoundError("Тип недвижимости не найден");
      }
    }

    const nextPricePerDay = data.pricePerDay ?? property.pricePerDay;
    const nextPricePerMonth = data.pricePerMonth ?? property.pricePerMonth;
    const nextAreaSqM = data.areaSqM ?? property.areaSqM;
    const nextMaxGuests = data.maxGuests ?? property.maxGuests;
    const nextBedrooms = data.bedrooms ?? property.bedrooms;
    const nextBathrooms = data.bathrooms ?? property.bathrooms;
    const nextMinRentDays = data.minRentDays ?? property.minRentDays;
    const nextMaxRentDays = data.maxRentDays ?? property.maxRentDays;

    this.validatePropertyData({
      pricePerDay: nextPricePerDay,
      pricePerMonth: nextPricePerMonth,
      areaSqM: nextAreaSqM,
      maxGuests: nextMaxGuests,
      bedrooms: nextBedrooms,
      bathrooms: nextBathrooms,
      minRentDays: nextMinRentDays,
      maxRentDays: nextMaxRentDays,
    });

    this.propertyRepository.merge(property, data);
    return this.propertyRepository.save(property);
  }

  async delete(id: number, userId: number, userRole: string) {
    const property = await this.propertyRepository.findOne({
      where: { id },
    });

    if (!property) {
      throw new NotFoundError("Объект недвижимости не найден");
    }

    this.ensureCanManageProperty(property, userId, userRole);
    await this.propertyRepository.remove(property);
  }

  private ensureCanManageProperty(property: Property, userId: number, userRole: string) {
    const isAdmin = userRole === "ADMIN";
    const isOwner = property.ownerId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenError("У вас нет прав на управление этой недвижимостью");
    }
  }

  private validatePropertyData(data: {
    pricePerDay: string;
    pricePerMonth: string;
    areaSqM: number;
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    minRentDays: number;
    maxRentDays: number;
  }) {
    const {
      pricePerDay,
      pricePerMonth,
      areaSqM,
      maxGuests,
      bedrooms,
      bathrooms,
      minRentDays,
      maxRentDays,
    } = data;

    if (Number.isNaN(Number(pricePerDay))) {
      throw new BadRequestError("Цена за день должна быть числом");
    }

    if (Number.isNaN(Number(pricePerMonth))) {
      throw new BadRequestError("Цена за месяц должна быть числом");
    }

    if (Number(pricePerDay) < 0) {
      throw new BadRequestError("Цена за день не может быть отрицательной");
    }

    if (Number(pricePerMonth) < 0) {
      throw new BadRequestError("Цена за месяц не может быть отрицательной");
    }

    if (areaSqM <= 0) {
      throw new BadRequestError("Площадь должна быть больше 0");
    }

    if (maxGuests <= 0) {
      throw new BadRequestError("Количество гостей должно быть больше 0");
    }

    if (bedrooms < 0) {
      throw new BadRequestError("Количество спален не может быть отрицательным");
    }

    if (bathrooms < 0) {
      throw new BadRequestError("Количество ванных комнат не может быть отрицательным");
    }

    if (minRentDays <= 0) {
      throw new BadRequestError("Минимальный срок аренды должен быть больше 0");
    }

    if (maxRentDays <= 0) {
      throw new BadRequestError("Максимальный срок аренды должен быть больше 0");
    }

    if (minRentDays > maxRentDays) {
      throw new BadRequestError("Минимальный срок аренды не может быть больше максимального");
    }
  }
}

export const propertiesService = new PropertiesService();
