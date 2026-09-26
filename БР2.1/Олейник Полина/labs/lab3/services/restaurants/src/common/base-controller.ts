import { Repository, ObjectLiteral } from 'typeorm';

// Копия лр1/src/common/base-controller.ts. Настоящее значение repository
// подставляет декоратор @EntityController (см. entity-controller.ts).
class BaseController {
    repository!: Repository<ObjectLiteral>;
}

export default BaseController;
