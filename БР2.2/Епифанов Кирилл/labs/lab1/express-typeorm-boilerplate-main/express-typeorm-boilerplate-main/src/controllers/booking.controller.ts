import {
    Body,
    Delete,
    Get,
    Param,
    Patch,
    Post
} from 'routing-controllers';

import { ObjectLiteral } from 'typeorm';

import BaseController from '../common/base-controller';
import EntityController from '../common/entity-controller';

import { Booking } from '../models/booking.entity';

@EntityController({
    baseRoute: '/bookings',
    entity: Booking,
})

class BookingController extends BaseController {

    @Get('')
    async getAll() {
        return await this.repository.find();
    }

    @Post('')
    async create(@Body() booking: Booking) {
        const createdBooking = this.repository.create(booking);

        return await this.repository.save(createdBooking);
    }

    @Get('/:id')
    async getById(@Param('id') id: number): Promise<ObjectLiteral> {
        const results = await this.repository.findOneBy({ id });

        if (!results) {
            throw new Error('Booking not found'); 
        }

        return results;
    }

    @Patch('/:id')
    async update(
        @Param('id') id: number,
        @Body() booking: Partial<Booking>,
    ): Promise<ObjectLiteral> {    
        const bookingForUpdate = await this.repository.findOneBy({ id });
            
        if (!bookingForUpdate) {
            throw new Error('Booking not found'); 
        }

        Object.assign(bookingForUpdate, booking);
        const results = await this.repository.save(bookingForUpdate);
        
        return results;
    }

    @Delete('/:id')
    async remove(@Param('id') id: number) {
        return `booking #${id} removed`;
    }
}

export default BookingController;