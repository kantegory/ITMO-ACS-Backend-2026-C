import * as jwt from "jsonwebtoken";
import { QUEUES, setupRpcServer } from "../../../shared/rabbitmq";
import {
    ValidateTokenRequest,
    ValidateTokenResponse,
} from "../../../shared/types";

const JWT_SECRET = "super_secret_key";

export async function startAuthConsumer(): Promise<void> {
    await setupRpcServer(QUEUES.AUTH_VALIDATE, async (payload) => {
        const { token } = payload as ValidateTokenRequest;

        if (!token) {
            return { isValid: false } satisfies ValidateTokenResponse;
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as {
                id: number;
                role: string;
            };

            return {
                isValid: true,
                userId: decoded.id,
                role: decoded.role,
            } satisfies ValidateTokenResponse;
        } catch {
            return { isValid: false } satisfies ValidateTokenResponse;
        }
    });

    console.log("Auth RabbitMQ consumer started");
}
