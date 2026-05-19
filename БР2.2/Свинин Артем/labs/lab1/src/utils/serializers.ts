import { Address } from "../models/Address";
import { Booking } from "../models/Booking";
import { Chat } from "../models/Chat";
import { Facility } from "../models/Facility";
import { Favourite } from "../models/Favourite";
import { Image } from "../models/Image";
import { Message } from "../models/Message";
import { Property } from "../models/Property";
import { PropertyFacility } from "../models/PropertyFacility";
import { PropertyType } from "../models/PropertyType";
import { Review } from "../models/Review";
import { Transaction } from "../models/Transaction";
import { User } from "../models/User";

export const serializeUser = (user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  middleName: user.middleName,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const serializeAddress = (address: Address) => ({
  id: address.id,
  country: address.country,
  city: address.city,
  district: address.district,
  houseNumber: address.houseNumber,
  apartment: address.apartment,
  postalCode: address.postalCode,
  lat: address.lat,
  lon: address.lon,
  createdAt: address.createdAt,
  updatedAt: address.updatedAt,
});

export const serializePropertyType = (propertyType: PropertyType) => ({
  id: propertyType.id,
  name: propertyType.name,
  description: propertyType.description,
  createdAt: propertyType.createdAt,
  updatedAt: propertyType.updatedAt,
});

export const serializeFacility = (facility: Facility) => ({
  id: facility.id,
  type: facility.type,
  createdAt: facility.createdAt,
  updatedAt: facility.updatedAt,
});

export const serializePropertySummary = (property: Property) => ({
  id: property.id,
  ownerId: property.ownerId,
  typeId: property.typeId,
  addressId: property.addressId,
  title: property.title,
  description: property.description,
  pricePerDay: property.pricePerDay,
  pricePerMonth: property.pricePerMonth,
  areaSqM: property.areaSqM,
  maxGuests: property.maxGuests,
  bedrooms: property.bedrooms,
  bathrooms: property.bathrooms,
  isAvailable: property.isAvailable,
  minRentDays: property.minRentDays,
  maxRentDays: property.maxRentDays,
  createdAt: property.createdAt,
  updatedAt: property.updatedAt,
});

export const serializeProperty = (property: Property) => ({
  ...serializePropertySummary(property),
  owner: property.owner ? serializeUser(property.owner) : undefined,
  type: property.type ? serializePropertyType(property.type) : undefined,
  address: property.address ? serializeAddress(property.address) : undefined,
});

export const serializeBookingSummary = (booking: Booking) => ({
  id: booking.id,
  propertyId: booking.propertyId,
  occupierId: booking.occupierId,
  startDate: booking.startDate,
  endDate: booking.endDate,
  totalPrice: booking.totalPrice,
  status: booking.status,
  guestsCount: booking.guestsCount,
  specialRequest: booking.specialRequest,
  cancellationReason: booking.cancellationReason,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
});

export const serializeBooking = (booking: Booking) => ({
  ...serializeBookingSummary(booking),
  property: booking.property ? serializeProperty(booking.property) : undefined,
  occupier: booking.occupier ? serializeUser(booking.occupier) : undefined,
});

export const serializeReview = (review: Review) => ({
  id: review.id,
  bookingId: review.bookingId,
  propertyId: review.propertyId,
  reviewerId: review.reviewerId,
  targetType: review.targetType,
  rating: review.rating,
  comment: review.comment,
  responseText: review.responseText,
  responseDate: review.responseDate,
  createdAt: review.createdAt,
  booking: review.booking ? serializeBookingSummary(review.booking) : undefined,
  property: review.property ? serializePropertySummary(review.property) : undefined,
  reviewer: review.reviewer ? serializeUser(review.reviewer) : undefined,
});

export const serializeTransaction = (transaction: Transaction) => ({
  id: transaction.id,
  bookingId: transaction.bookingId,
  paymentMethod: transaction.paymentMethod,
  status: transaction.status,
  transactionDate: transaction.transactionDate,
  paymentId: transaction.paymentId,
  currency: transaction.currency,
  amount: transaction.amount,
  feeAmount: transaction.feeAmount,
  refundedAmount: transaction.refundedAmount,
  booking: transaction.booking ? serializeBookingSummary(transaction.booking) : undefined,
});

export const serializeChatSummary = (chat: Chat) => ({
  id: chat.id,
  ownerId: chat.ownerId,
  occupierId: chat.occupierId,
  propertyId: chat.propertyId,
  bookingId: chat.bookingId,
  createdAt: chat.createdAt,
  lastMessageAt: chat.lastMessageAt,
});

export const serializeChat = (chat: Chat) => ({
  ...serializeChatSummary(chat),
  owner: chat.owner ? serializeUser(chat.owner) : undefined,
  occupier: chat.occupier ? serializeUser(chat.occupier) : undefined,
  property: chat.property ? serializePropertySummary(chat.property) : undefined,
  booking: chat.booking ? serializeBookingSummary(chat.booking) : undefined,
});

export const serializeMessage = (message: Message) => ({
  id: message.id,
  chatId: message.chatId,
  senderId: message.senderId,
  content: message.content,
  sentAt: message.sentAt,
  isRead: message.isRead,
  readAt: message.readAt,
  chat: message.chat ? serializeChatSummary(message.chat) : undefined,
  sender: message.sender ? serializeUser(message.sender) : undefined,
});

export const serializeImage = (image: Image) => ({
  id: image.id,
  propertyId: image.propertyId,
  imageUrl: image.imageUrl,
  isMain: image.isMain,
  createdAt: image.createdAt,
  property: image.property ? serializePropertySummary(image.property) : undefined,
});

export const serializeFavourite = (favourite: Favourite) => ({
  id: favourite.id,
  userId: favourite.userId,
  propertyId: favourite.propertyId,
  addedAt: favourite.addedAt,
  user: favourite.user ? serializeUser(favourite.user) : undefined,
  property: favourite.property ? serializePropertySummary(favourite.property) : undefined,
});

export const serializePropertyFacility = (propertyFacility: PropertyFacility) => ({
  id: propertyFacility.id,
  propertyId: propertyFacility.propertyId,
  facilityId: propertyFacility.facilityId,
  createdAt: propertyFacility.createdAt,
  property: propertyFacility.property ? serializePropertySummary(propertyFacility.property) : undefined,
  facility: propertyFacility.facility ? serializeFacility(propertyFacility.facility) : undefined,
});

export const serializeItems = <T, R>(items: T[], serializer: (item: T) => R) => items.map(serializer);

export const serializePage = <T, R>(
  page: { items: T[]; total: number; page: number; pageSize: number },
  serializer: (item: T) => R
) => ({
  ...page,
  items: page.items.map(serializer),
});
