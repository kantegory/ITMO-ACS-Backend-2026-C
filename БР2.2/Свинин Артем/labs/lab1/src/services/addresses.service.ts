import { AppDataSource } from "../config/data-source";
import { ForbiddenError, NotFoundError } from "../errors/http-errors";
import { Address } from "../models/Address";
import { Property } from "../models/Property";

interface CreateAddressInput {
  country: string;
  city: string;
  district?: string;
  houseNumber: string;
  apartment?: string;
  postalCode?: string;
  lat?: number;
  lon?: number;
}

interface UpdateAddressInput extends Partial<CreateAddressInput> {}

export class AddressesService {
  private addressRepository = AppDataSource.getRepository(Address);
  private propertyRepository = AppDataSource.getRepository(Property);

  async create(data: CreateAddressInput) {
    const address = this.addressRepository.create(data);
    return this.addressRepository.save(address);
  }

  async getAll() {
    return this.addressRepository.find({
      order: {
        id: "ASC",
      },
    });
  }

  async getById(id: number) {
    const address = await this.addressRepository.findOne({ where: { id } });

    if (!address) {
      throw new NotFoundError("Адрес не найден");
    }

    return address;
  }

  async update(id: number, data: UpdateAddressInput, userId: number, userRole: string) {
    const address = await this.addressRepository.findOne({ where: { id } });

    if (!address) {
      throw new NotFoundError("Адрес не найден");
    }

    await this.ensureCanManageAddress(id, userId, userRole);
    this.addressRepository.merge(address, data);
    return this.addressRepository.save(address);
  }

  async delete(id: number, userId: number, userRole: string) {
    const address = await this.addressRepository.findOne({ where: { id } });

    if (!address) {
      throw new NotFoundError("Адрес не найден");
    }

    await this.ensureCanManageAddress(id, userId, userRole);
    await this.addressRepository.remove(address);
  }

  private async ensureCanManageAddress(addressId: number, userId: number, userRole: string) {
    if (userRole === "ADMIN") {
      return;
    }

    const linkedProperties = await this.propertyRepository.find({
      where: { addressId },
      select: { id: true, ownerId: true },
    });

    // Новый адрес можно изменить до того, как он будет привязан к объекту недвижимости.
    if (linkedProperties.length === 0) {
      return;
    }

    const ownsLinkedProperty = linkedProperties.some((property) => property.ownerId === userId);
    if (!ownsLinkedProperty) {
      throw new ForbiddenError("У вас нет прав на управление этим адресом");
    }
  }
}

export const addressesService = new AddressesService();
