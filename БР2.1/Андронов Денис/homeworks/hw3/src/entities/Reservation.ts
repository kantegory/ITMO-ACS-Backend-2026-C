import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum ReservationStatus {
    DECLINED = "DECLINED",
    CONFIRMED = "CONFIRMED",
    IN_PROGRESS = "IN_PROGRESS",
    PASSED = "PASSED"
}

@Entity("reservations")
export class Reservation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    restaurant_id: number;

    @Column()
    reservation_time: Date;

    @Column()
    guests_count: number;

    @Column({ type: "enum", enum: ReservationStatus, default: ReservationStatus.IN_PROGRESS })
    status: ReservationStatus;
}