import { Repository, In, SelectQueryBuilder, EntityManager } from "typeorm";
import dataSource from "../config/data-source";
import {
  Accommodation,
  Address,
  RentTerms,
  Facility,
  AccomPhoto,
  Availability,
} from "../models";
import {
  CreateAccommodationDto,
  UpdateAccommodationDto,
  SearchFiltersDto,
  AccommodationItem,
  UserValDTO,
} from "../dto";
import settings from "../config/config";
import { serviceGet } from "common";

function omitUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined),
  ) as Partial<T>;
}

class AccommodationService {
  private accommodationRepo: Repository<Accommodation>;
  private addressRepo: Repository<Address>;
  private rentTermsRepo: Repository<RentTerms>;
  private facilityRepo: Repository<Facility>;
  private photoRepo: Repository<AccomPhoto>;
  private availabilityRepo: Repository<Availability>;

  constructor() {
    this.accommodationRepo = dataSource.getRepository(Accommodation);
    this.addressRepo = dataSource.getRepository(Address);
    this.rentTermsRepo = dataSource.getRepository(RentTerms);
    this.facilityRepo = dataSource.getRepository(Facility);
    this.photoRepo = dataSource.getRepository(AccomPhoto);
    this.availabilityRepo = dataSource.getRepository(Availability);
  }

  private withRelations() {
    return ["address", "rent_terms", "facilities", "photos"] as const;
  }

  private async runInTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return dataSource.transaction(work);
  }

  private findWithRelations(id: string) {
    return this.accommodationRepo.findOne({
      where: { id },
      relations: [...this.withRelations()],
    });
  }

  private async hasDateConflict(
    accommodationId: string,
    startDate: string,
    endDate: string,
  ): Promise<boolean> {
    const count = await this.availabilityRepo
      .createQueryBuilder("a")
      .where("a.accom_id = :id", { id: accommodationId })
      .andWhere("a.start_date < :end", {
        end: new Date(`${endDate}T23:59:59.999Z`),
      })
      .andWhere("a.end_date > :start", {
        start: new Date(`${startDate}T00:00:00.000Z`),
      })
      .getCount();

    return count > 0;
  }

  private applySearchFilters(
    qb: SelectQueryBuilder<Accommodation>,
    filters: SearchFiltersDto,
  ): SelectQueryBuilder<Accommodation> {
    if (filters.city) {
      qb.andWhere("LOWER(address.city) = LOWER(:city)", { city: filters.city });
    }
    if (filters.accomType) {
      qb.andWhere("a.accom_type = :accomType", {
        accomType: filters.accomType,
      });
    }
    if (filters.roomsNum !== undefined) {
      qb.andWhere("a.rooms_num = :roomsNum", { roomsNum: filters.roomsNum });
    }
    if (filters.withKids !== undefined) {
      qb.andWhere("rentTerms.with_kids = :withKids", {
        withKids: filters.withKids,
      });
    }
    if (filters.withPets !== undefined) {
      qb.andWhere("rentTerms.with_pets = :withPets", {
        withPets: filters.withPets,
      });
    }
    if (filters.minPrice !== undefined) {
      qb.andWhere("rentTerms.price >= :minPrice", {
        minPrice: filters.minPrice,
      });
    }
    if (filters.maxPrice !== undefined) {
      qb.andWhere("rentTerms.price <= :maxPrice", {
        maxPrice: filters.maxPrice,
      });
    }
    return qb;
  }

  private async getFacilitiesByName(names: string[]): Promise<Facility[]> {
    if (!names.length) return [];
    const facilities = await this.facilityRepo.find({
      where: { name: In(names) },
    });
    const found = new Set(facilities.map((f) => f.name));
    const notFound = names.filter((name) => !found.has(name));
    if (notFound.length) {
      throw new Error(`Facilities not found: ${notFound.join(", ")}`);
    }
    return facilities;
  }

  private async saveAddress(
    manager: EntityManager,
    existing: Address | null,
    dto: Partial<Address>,
  ): Promise<Address> {
    if (!existing) {
      return manager.save(Address, manager.create(Address, dto));
    }
    Object.assign(existing, omitUndefined(dto));
    return manager.save(Address, existing);
  }

  private async saveRentTerms(
    manager: EntityManager,
    existing: RentTerms | null,
    dto: Partial<RentTerms>,
  ): Promise<RentTerms> {
    if (!existing) {
      return manager.save(RentTerms, manager.create(RentTerms, dto));
    }
    Object.assign(existing, omitUndefined(dto));
    return manager.save(RentTerms, existing);
  }

  validateUsers = async (userIds: string[]): Promise<UserValDTO[]> => {
    const ids = userIds.join(",");
    const url = `${settings.USER_URL}/internal/batch?ids=${encodeURIComponent(ids)}`;
    return await serviceGet<UserValDTO[]>(url);
  };

  createFacility = async (name: string): Promise<Facility> => {
    const existing = await this.facilityRepo.findOneBy({ name });
    if (existing) return existing;
    return this.facilityRepo.save(this.facilityRepo.create({ name }));
  };

  getMyLandlord = async (id: string): Promise<Accommodation[]> => {
    return this.accommodationRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.address", "address")
      .leftJoinAndSelect("a.rent_terms", "rentTerms")
      .leftJoinAndSelect("a.facilities", "facilities")
      .leftJoinAndSelect("a.photos", "photos")
      .where("a.landlord_id = :id", { id })
      .getMany();
  };

  getById = async (id: string): Promise<Accommodation | null> => {
    return this.findWithRelations(id);
  };

  async getAll(): Promise<Accommodation[]> {
    return this.accommodationRepo.find({
      relations: [...this.withRelations()],
    });
  }

  batch = async (ids: string[]): Promise<AccommodationItem[]> => {
    if (!ids.length) return [];

    const accs = await this.accommodationRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.address", "address")
      .leftJoinAndSelect("a.rent_terms", "rentTerms")
      .leftJoinAndSelect("a.facilities", "facilities")
      .leftJoinAndSelect("a.photos", "photos")
      .where("a.id IN (:...ids)", { ids })
      .getMany();

    return accs.map((acc) => ({
      accommodationId: acc.id,
      accommodation: {
        title: acc.title,
        roomsNum: acc.rooms_num,
        // isRented: acc.is_rented,
        address: {
          city: acc.address.city,
          district: acc.address.district ?? null,
          street: acc.address.street,
          house_num: acc.address.house_num,
          building: acc.address.building ?? null,
        },
        rentTerms: {
          price: acc.rent_terms?.price ?? 0,
          deposit: acc.rent_terms?.deposit ?? null,
          commission: acc.rent_terms?.commission ?? null,
          withKids: acc.rent_terms?.with_kids ?? false,
          withPets: acc.rent_terms?.with_pets ?? false,
        },
      },
    }));
  };

  search = async (filters: SearchFiltersDto): Promise<Accommodation[]> => {
    const qb = this.accommodationRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.address", "address")
      .leftJoinAndSelect("a.rent_terms", "rentTerms");

    return this.applySearchFilters(qb, filters).getMany();
  };

  create = async (
    dto: CreateAccommodationDto,
    landlordId: string,
  ): Promise<Accommodation> => {
    const saved = await this.runInTransaction(async (manager) => {
      const address = await manager.save(
        Address,
        manager.create(Address, dto.address),
      );

      const rentTerms = await manager.save(
        RentTerms,
        manager.create(RentTerms, dto.rent_terms),
      );

      const facilities = dto.facility_names?.length
        ? await this.getFacilitiesByName(dto.facility_names)
        : [];

      const accommodation = manager.create(Accommodation, {
        ...dto.accommodation,
        landlord_id: landlordId,
        address,
        rent_terms: rentTerms,
        facilities,
        is_rented: false,
        // is_published: false,
      });

      return manager.save(Accommodation, accommodation);
    });

    return (await this.findWithRelations(saved.id))!;
  };

  updateById = async (
    id: string,
    dto: UpdateAccommodationDto,
  ): Promise<Accommodation | null> => {
    const acc = await this.findWithRelations(id);
    if (!acc) return null;

    await this.runInTransaction(async (manager) => {
      if (dto.accommodation) {
        Object.assign(acc, omitUndefined(dto.accommodation));
      }

      if (dto.address) {
        acc.address = await this.saveAddress(manager, acc.address, dto.address);
      }

      if (dto.rent_terms) {
        acc.rent_terms = await this.saveRentTerms(
          manager,
          acc.rent_terms ?? null,
          dto.rent_terms,
        );
      }

      if (dto.facility_names) {
        acc.facilities = await this.getFacilitiesByName(dto.facility_names);
      }

      await manager.save(Accommodation, acc);
    });

    return this.findWithRelations(id);
  };

  deleteById = async (id: string): Promise<boolean> => {
    const result = await this.accommodationRepo.delete(id);
    return (result.affected ?? 0) > 0;
  };

  isAvailableDates = async (
    id: string,
    start: string,
    end: string,
  ): Promise<boolean | null> => {
    const acc = await this.accommodationRepo.findOneBy({ id });
    if (!acc) return null;
    const conflict = await this.hasDateConflict(id, start, end);
    return !conflict;
  };

  checkAvailability = async (
    accommodationId: string,
    startDate: string,
    endDate: string,
  ) => {
    const acc = await this.accommodationRepo.findOne({
      where: { id: accommodationId },
      relations: ["rent_terms"],
    });
    if (!acc) return { available: false, reason: "Accommodation not found" };

    const conflict = await this.hasDateConflict(
      accommodationId,
      startDate,
      endDate,
    );

    if (conflict) {
      return {
        available: false,
        reason: "Dates already booked",
        landlordId: acc.landlord_id,
        totalAmount: acc.rent_terms?.price || 0,
      };
    }

    return {
      available: true,
      landlordId: acc.landlord_id,
      totalAmount: acc.rent_terms?.price || 0,
    };
  };

  blockDates = async (
    accommodationId: string,
    startDate: string,
    endDate: string,
    rentId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (await this.hasDateConflict(accommodationId, startDate, endDate)) {
      return { success: false, error: "DATES_OVERLAP" };
    }

    await this.availabilityRepo.save(
      this.availabilityRepo.create({
        accommodation: { id: accommodationId } as Accommodation,
        start_date: new Date(`${startDate}T00:00:00.000Z`),
        end_date: new Date(`${endDate}T23:59:59.999Z`),
        rent_id: rentId,
      }),
    );
    return { success: true };
  };

  addPhoto = async (
    accomId: string,
    url: string,
  ): Promise<Accommodation | null> => {
    const acc = await this.findWithRelations(accomId);
    if (!acc) return null;

    await this.photoRepo.save(
      this.photoRepo.create({
        accom_id: accomId,
        photo_url: url,
        is_main: false,
        sort_order: 0,
      }),
    );

    return this.findWithRelations(accomId);
  };

  deletePhoto = async (
    accomId: string,
    photoId: string,
  ): Promise<Accommodation | null> => {
    const photo = await this.photoRepo.findOneBy({
      id: photoId,
      accom_id: accomId,
    });
    if (!photo) return null;

    await this.photoRepo.remove(photo);
    return this.findWithRelations(accomId);
  };

  findBookingByRentId = async (rentId: string) => {
    const booking = await this.availabilityRepo.findOne({
      where: { rent_id: rentId },
      relations: ["accommodation"],
    });

    if (!booking || !booking.accommodation) return null;

    return {
      accommodationId: booking.accommodation.id,
      startDate: booking.start_date.toISOString(),
      endDate: booking.end_date.toISOString(),
    };
  };

  unblockDates = async (
    accommodationId: string,
    startDate: string,
    endDate: string,
  ) => {
    await this.availabilityRepo
      .createQueryBuilder()
      .delete()
      .from(Availability)
      .where("accom_id = :accommodationId", { accommodationId })
      .andWhere("start_date = :start", {
        start: new Date(`${startDate}T00:00:00.000Z`),
      })
      .andWhere("end_date = :end", {
        end: new Date(`${endDate}T23:59:59.999Z`),
      })
      .execute();

    const remaining = await this.availabilityRepo
      .createQueryBuilder("a")
      .where("a.accom_id = :accommodationId", { accommodationId })
      .getCount();

    // if (remaining === 0) {
    //   await this.updateRentedStatus(accommodationId, false);
    // }
  };
}

export default new AccommodationService();
