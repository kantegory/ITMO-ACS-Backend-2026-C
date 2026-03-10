import { AppDataSource } from "../config/data-source";
import { BadRequestError, ConflictError, NotFoundError } from "../errors/http-errors";
import { Facility } from "../models/Facility";

interface CreateFacilityInput {
  type: string;
}

interface UpdateFacilityInput {
  type?: string;
}

export class FacilitiesService {
  private facilityRepository = AppDataSource.getRepository(Facility);

  async create(data: CreateFacilityInput) {
    const { type } = data;

    if (!type || !type.trim()) {
      throw new BadRequestError("Название удобства не может быть пустым");
    }

    const existingFacility = await this.facilityRepository.findOne({
      where: { type: type.trim() },
    });

    if (existingFacility) {
      throw new ConflictError("Такое удобство уже существует");
    }

    const facility = this.facilityRepository.create({ type: type.trim() });
    return this.facilityRepository.save(facility);
  }

  async getAll() {
    return this.facilityRepository.find({
      order: { id: "ASC" },
    });
  }

  async update(id: number, data: UpdateFacilityInput) {
    const facility = await this.facilityRepository.findOne({ where: { id } });
    if (!facility) {
      throw new NotFoundError("Удобство не найдено");
    }

    if (data.type && data.type.trim() && data.type.trim() !== facility.type) {
      const duplicate = await this.facilityRepository.findOne({
        where: { type: data.type.trim() },
      });

      if (duplicate) {
        throw new ConflictError("Такое удобство уже существует");
      }

      facility.type = data.type.trim();
    }

    return this.facilityRepository.save(facility);
  }

  async delete(id: number) {
    const facility = await this.facilityRepository.findOne({ where: { id } });
    if (!facility) {
      throw new NotFoundError("Удобство не найдено");
    }

    await this.facilityRepository.remove(facility);
  }
}

export const facilitiesService = new FacilitiesService();
