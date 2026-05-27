import { CatalogDataSource } from "../database";
import { Restaurant } from "../entities/Restaurant";
import { QUEUES, setupRpcServer } from "../../../shared/rabbitmq";
import {
    RestaurantCheckRequest,
    RestaurantCheckResponse,
} from "../../../shared/types";

export async function startCatalogConsumer(): Promise<void> {
    await setupRpcServer(QUEUES.CATALOG_CHECK, async (payload) => {
        const { restaurantId } = payload as RestaurantCheckRequest;
        const repo = CatalogDataSource.getRepository(Restaurant);
        const restaurant = await repo.findOneBy({ id: restaurantId });

        if (!restaurant) {
            return { found: false } satisfies RestaurantCheckResponse;
        }

        return {
            found: true,
            id: restaurant.id,
            name: restaurant.name,
            isActive: restaurant.isActive,
        } satisfies RestaurantCheckResponse;
    });

    console.log("Catalog RabbitMQ consumer started");
}
