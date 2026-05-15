import { In, Repository } from "typeorm";
import dataSource from "../config/data-source";
import { Rent, RentStatus } from "../models/rent.entity";
import { publish, Topics, serviceGet } from "common";
import settings from "../config/config";
import {
  RentWithAccommodationDto,
  AccommodationLookupItem,
  CreateRentDto,
  UserValDTO,
} from "../dto/rent.dto";
import { RentCreationResult, AvailabilityResponse } from "../types/express";

export class RentService {
  private rentRepo: Repository<Rent>;

  constructor() {
    this.rentRepo = dataSource.getRepository(Rent);
  }

  async getAll(): Promise<Rent[]> {
    return this.rentRepo.find();
  }

  private async patchRent(
    id: string,
    patch: Partial<Rent>,
  ): Promise<Rent | null> {
    const rent = await this.rentRepo.findOneBy({ id });
    if (!rent) return null;
    Object.assign(rent, patch);
    return this.rentRepo.save(rent);
  }

  async getMyTenant(id: string): Promise<Rent[]> {
    return this.rentRepo
      .createQueryBuilder("r")
      .where("r.tenant_id = :id", { id })
      .getMany();
  }

  async getMyTenantWithAccommodations(
    userId: string,
  ): Promise<RentWithAccommodationDto[]> {
    const rents = await this.getMyTenant(userId);
    if (!rents.length) return [];

    const accommodationIds = [...new Set(rents.map((r) => r.accommodation_id))];
    const accommodations = await this.getAccommodationData(accommodationIds);
    const accMap = new Map(
      accommodations.map((a) => [a.accommodationId, a.accommodation]),
    );
    return rents.map((rent) => ({
      // id: rent.id,
      // accommodation_id: rent.accommodation_id,
      // landlord_id: rent.landlord_id,
      // tenant_id: rent.tenant_id,
      total_amount: rent.total_amount,
      start_date: rent.start_date,
      end_date: rent.end_date,
      status: rent.status,
      // created_at: rent.created_at,
      // updated_at: rent.updated_at,
      accommodation: accMap.get(rent.accommodation_id) ?? null,
    }));
  }

  async getAccommodationData(
    accommodationIds: string[],
  ): Promise<AccommodationLookupItem[]> {
    const ids = accommodationIds.join(",");
    const url = `${settings.ACCOMMODATION_URL}/internal/batch?ids=${encodeURIComponent(ids)}`;
    return await serviceGet<AccommodationLookupItem[]>(url);
  }

  async requestRent(params: CreateRentDto): Promise<RentCreationResult> {
    const availability = await this.checkAvailabilityViaApi(
      params.accommodationId,
      params.startDate,
      params.endDate,
    );

    if (!availability.available) {
      return {
        success: false,
        error: availability.reason || "ACCOMMODATION_NOT_AVAILABLE",
      };
    }

    const rent = this.rentRepo.create({
      tenant_id: params.tenantId,
      accommodation_id: params.accommodationId,
      start_date: new Date(params.startDate),
      end_date: new Date(params.endDate),
      status: RentStatus.PENDING,
      total_amount: availability.totalAmount || 0,
      landlord_id: availability.landlordId || null,
    });

    const saved = await this.rentRepo.save(rent);

    await publish(Topics.Rent, {
      eventType: "rent.created",
      rentId: saved.id,
      tenantId: saved.tenant_id,
      landlordId: saved.landlord_id,
      accommodationId: saved.accommodation_id,
      startDate: params.startDate,
      endDate: params.endDate,
      amount: Number(saved.total_amount),
      timestamp: Date.now(),
    });

    return { success: true, rent: saved };
  }

  private async checkAvailabilityViaApi(
    accommodationId: string,
    startDate: string,
    endDate: string,
  ): Promise<AvailabilityResponse> {
    const url = `${settings.ACCOMMODATION_URL}/internal/${accommodationId}/availability?start=${startDate}&end=${endDate}`;

    try {
      const response = await serviceGet<any>(url);

      if (response.available && typeof response.available === "object") {
        return response.available;
      }

      return response;
    } catch {
      return { available: false, reason: "Failed to check availability" };
    }
  }

  async cancelRent(rentId: string, reason: string): Promise<Rent | null> {
    const rent = await this.patchRent(rentId, { status: RentStatus.CLOSED });
    if (!rent) return null;

    await publish(Topics.Rent, {
      eventType: "rent.cancelled",
      rentId,
      reason,
      timestamp: Date.now(),
    });

    return rent;
  }

  async getById(id: string): Promise<Rent | null> {
    return this.rentRepo.findOneBy({ id });
  }

  async getByIds(ids: string[]): Promise<Rent[]> {
    return this.rentRepo.findBy({ id: In(ids) });
  }

  async getByAccommodation(
    accommodationId: string,
    status?: string,
  ): Promise<Rent[]> {
    const query = this.rentRepo
      .createQueryBuilder("rent")
      .where("rent.accommodation_id = :accommodationId", { accommodationId });

    if (status) {
      query.andWhere("rent.status = :status", { status });
    }

    return query.getMany();
  }

  async validateUsers(userIds: string[]): Promise<UserValDTO[]> {
    const ids = userIds.join(",");
    const url = `${settings.USER_URL}/internal/batch?ids=${encodeURIComponent(ids)}`;
    return await serviceGet<UserValDTO[]>(url);
  }

  async getActiveByAccommodation(accommodationId: string): Promise<Rent[]> {
    return this.rentRepo.find({
      where: {
        accommodation_id: accommodationId,
        status: In([RentStatus.ONGOING, RentStatus.PENDING_PAYMENT]),
      },
    });
  }
  async markAsPendingPayment(rentId: string): Promise<Rent | null> {
    return this.patchRent(rentId, { status: RentStatus.PENDING_PAYMENT });
  }

  async confirmRent(rentId: string): Promise<Rent | null> {
    return this.patchRent(rentId, { status: RentStatus.ONGOING });
  }

  async handlePaymentCaptured(rentId: string) {
    await this.patchRent(rentId, { status: RentStatus.ONGOING });
  }

  async handlePaymentFailure(rentId: string, reason: string) {
    await this.cancelRent(rentId, `Payment failed: ${reason}`);
  }
}

export default new RentService();
